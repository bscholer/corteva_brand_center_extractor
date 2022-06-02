var productTypes = ["Fungicide", "Herbicide", "Insecticide", "Nematicide", "Nitrogen Stabilizer", "Seed Treatment"];

let countries = [];
$.ajax("https://gist.githubusercontent.com/bscholer/2c859ae7d2e1b27d8440f32064f97aba/raw/a2c80801425e359d3d4baf1535de676cfc142797/countries.csv").done((data) => {
    let preCountries = Papa.parse(data);
    preCountries = preCountries.data[0];
    for (let country of preCountries) {
        countries.push(country.match(/\|(.+)/)[1]);
    }
})

showDownloadButton();

let numRegex = /\d+/;

$(".hselectdd.no_select>.selected").filter(function () {
    return numRegex.test($(this).text());
})[0].click()

// Wait for the loading bar to exist
var checkLoadingBarExists = setInterval(function () {
    var $loadingBar = $(".advf_loading");
    if ($loadingBar.length) {
        // Create the observer
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === "class") {
                    let attributeValue = $(mutation.target).prop(mutation.attributeName);
                    if (!attributeValue.match("active")) {
                        showDownloadButton();
                        // console.log("Showing download button");
                    }
                    // console.log("Class attribute changed to:", attributeValue);
                }
            });
        });
        observer.observe($loadingBar[0], {
            attributes: true
        });
        clearInterval(checkLoadingBarExists);
    }
}, 100);


function showDownloadButton() {
    let downloadButton = "<div><a id='download-results-button'>Download Results</a></div>"
    $(".total_results>.sort-controls").after(downloadButton);
    $("#download-results-button").on('click', () => {
        run();
    });
}

let count = 0;

var data = [];

function run() {
    let resultsRegex = /(\d+)-(\d+) of (\d+)/
    let totalResults = $(".total_results>.summary")[0].innerText;

    let beginIndex = totalResults.match(resultsRegex)[1];
    let endIndex = totalResults.match(resultsRegex)[2];
    let totalItems = totalResults.match(resultsRegex)[3];
    // console.log([beginIndex, endIndex, totalItems]);

    // alert("An automated script will now go through each result, capture the data, and download it as a CSV file.\nPlease DO NOT interact with the page until the CSV has been downloaded.\nDoing something else in another tab is OK.")

    let items = $(".items>tbody>tr")
    if (items.length > 0) {
        $(items[0]).find(".description>a.info")[0].click();

        var checkExist = setInterval(function () {
            // rows = $("table.info_2>tbody").find("tr");
            if ($("table.info_2>tbody").find("tr").length) {
                // console.log("it's open");
                // Collect the info
                var collectInfo = () => {
                    rows = $("table.info_2>tbody").find("tr");
                    let itemInfo = {};
                    for (let row of rows) {
                        let cells = $(row).find("td")
                        if (cells.length === 2) {
                            let name = cells[0].innerText.toLowerCase().trim();
                            itemInfo[name] = cells[1].innerText.trim();
                        }
                    }

                    if (itemInfo["tags"]) {
                        let matchingCountry;
                        for (let country of countries) {
                            if (itemInfo.tags.match(country)) matchingCountry = country;
                        }
                        itemInfo.country = matchingCountry;
                        if (itemInfo["tags"].match("U.S.")) itemInfo.country = "United States"
                    }

                    // Put it into data
                    return itemInfo;
                }
                let prevInfo = collectInfo();
                count++;
                data.push(prevInfo);
                // Click next page button
                let moveToNext = () => {
                    if (!$(".image-next-trigger>a").length) {
                        return;
                    }
                    $(".image-next-trigger>a")[0].click();
                    // Wait for it to be different
                    let checkDifferentCounter = 0;
                    var checkDifferent = setInterval(function () {
                        checkDifferentCounter++;
                        // Wait for 10 seconds before pressing the next button again.
                        if (checkDifferentCounter === 100) {
                            checkDifferentCounter = 0;
                            $(".image-next-trigger>a")[0].click();
                        }
                        let curInfo = collectInfo()
                        // console.log([prevInfo]);
                        if (!(curInfo.title === prevInfo.title && curInfo.usage === prevInfo.usage)) {
                            prevInfo = collectInfo();

                            data.push(prevInfo);

                            console.log("Have " + data.length + " logos.");
                            // console.log(data);
                            count++;
                            console.log(count + "/" + totalItems + " collected.");
                            if (count !== (endIndex - beginIndex + 1)) {
                                moveToNext();
                            }

                            // We're all done with this page
                            if (count + "" === endIndex || !$(".image-next-trigger>a").length) {

                                // Download partial regardless
                                let cleanedData = cleanData(data);
                                let noDupes = removeDuplicates(cleanedData);
                                let csv = Papa.unparse(cleanedData);
                                let noDupesCsv = Papa.unparse(noDupes);
                                let title = $(".content>.main_title")[0].innerText;

                                download(`PARTIAL_${title}_${beginIndex}_to_${endIndex}_of_${totalItems}.csv`, csv);
                                download(`PARTIAL_NO_DUPLICATES_${title}_${beginIndex}_to_${endIndex}_of_${totalItems}.csv`, noDupesCsv);

                                // If we're totally done, download the final file
                                if ($(".bottom.pager").find(".selected").next().length === 0) {
                                    let cleanedData = cleanData(data);
                                    let noDupes = removeDuplicates(cleanedData);
                                    let csv = Papa.unparse(cleanedData);
                                    let noDupesCsv = Papa.unparse(noDupes);
                                    let title = $(".content>.main_title")[0].innerText;

                                    download(`FINAL_${title}_${totalItems}_items.csv`, csv);
                                    download(`FINAL_NO_DUPLICATES${title}_${totalItems}_items.csv`, noDupesCsv);
                                }

                                // Otherwise, move to the next page
                                else {
                                    $(".ui-icon-closethick")[0].click();
                                    // $(".bottom.pager").find(".next>a")[0].click();
                                    $(".bottom.pager").find(".selected").next().find("a")[0].click();
                                    var waitForNextPage = setInterval(() => {
                                        if (!$(".advf_loading.active").length) {
                                            // console.log("Loader is gone");
                                            // Gotta get rid of the old rows because for some reason they aren't removed on their own...
                                            $("table.info_2>tbody").empty();
                                            run();
                                            clearInterval(waitForNextPage);
                                        }
                                    }, 100)
                                }
                            }
                            clearInterval(checkDifferent);
                        }
                    }, 100)
                }
                moveToNext();
                clearInterval(checkExist)
            }
        }, 100);
    }
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function cleanData(logos) {
    for (let logo of logos) {
        let productType = "";
        for (let type of productTypes) {
            if (logo.tags.toLowerCase().match(type.toLowerCase())) {
                productType = type;
            }
        }
        logo["product_category"] = productType;
    }

    for (let logo of logos) {
        if (!logo["product_category"]) {
            let productType = "";
            for (let type of productTypes) {
                if (logo.title.toLowerCase().match(type.toLowerCase())) {
                    productType = type;
                }
            }
            logo["product_category"] = productType;
        }
    }

    let correctedLogos = [];
    correctedLogos.push(logos[0]);
    for (let i = 1; i < logos.length; i++) {
        let matchingCountry;
        for (let country of countries) {
            if (logos[i].tags.toLowerCase().match(country.toLowerCase())) matchingCountry = country;
        }
        logos[i].country = matchingCountry;
        if (logos[i]["tags"].match("U.S.")) logos[i].country = "United States"
        if (logos[i]["tags"].match("US")) logos[i].country = "United States"
        if (logos[i]["tags"].match("U.K.")) logos[i].country = "United Kingdom"
        if (logos[i]["tags"].match("UK")) logos[i].country = "United Kingdom"
        if (logos[i]["tags"].match("Polska")) logos[i].country = "Poland"
        if (logos[i]["tags"].match("México")) logos[i].country = "Mexico"
        if (logos[i]["tags"].match("Deutschland")) logos[i].country = "Germany"
        if (logos[i]["tags"].match("Danmark")) logos[i].country = "Danmark"
        correctedLogos.push(logos[i]);
    }
    return correctedLogos;
}

function removeDuplicates(logos) {
    let noDupesLogos = [];
    noDupesLogos.push(logos[0]);
    for (let i = 1; i < logos.length; i++) {
        let foundMatch = false;
        for (let noDupe of noDupesLogos) {
            if (equals(noDupe, logos[i])) {
                foundMatch = true;
            }
        }
        if (!foundMatch) {
            noDupesLogos.push(logos[i])
        }
    }
    return noDupesLogos;
}

function equals(logo1, logo2) {
    if (logo1.title === logo2.title) {
        return true;
    }
    return false;
}
