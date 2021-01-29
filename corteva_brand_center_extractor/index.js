
let countries = [];
$.ajax("https://gist.githubusercontent.com/marijn/396531/raw/188caa065e3cd319fed7913ee3eecf5eec541918/countries.csv").done((data) => {
    let preCountries = Papa.parse(data);
    preCountries = preCountries.data[0];
    // console.log(preCountries);
    for (let country of preCountries) {
        // console.log("country = " + country);
        // console.log(country.match(/\|([A-Za-z]+)/));
        countries.push(country.match(/\|(.+)/)[1]);
    }
    console.log(countries);
})

let downloadButton = "<div><a id='download-results-button'>Download Results</a></div>"
$(".total_results>.sort-controls").after(downloadButton);
$("#download-results-button").on('click', () => {
    run()
});


let count = 0;

var data = [];
function run() {
    let resultsRegex = /(\d+)-(\d+) of (\d+)/
    let totalResults = $(".total_results>.summary")[0].innerText;

    let beginIndex = totalResults.match(resultsRegex)[1];
    let endIndex = totalResults.match(resultsRegex)[2];
    let totalItems = totalResults.match(resultsRegex)[3];
    console.log([beginIndex, endIndex, totalItems]);

    // alert("An automated script will now go through each result, capture the data, and download it as a CSV file.\nPlease DO NOT interact with the page until the CSV has been downloaded.\nDoing something else in another tab is OK.")

    let items = $(".items>tbody>tr")
    if (items.length > 0) {
        $(items[0]).find(".description>a.info")[0].click();

        var checkExist = setInterval(function () {
            // rows = $("table.info_2>tbody").find("tr");
            if ($("table.info_2>tbody").find("tr").length) {
                console.log("it's open");
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
                    var checkDifferent = setInterval(function () {
                        let curInfo = collectInfo()
                        // console.log([prevInfo]);
                        if (!(curInfo.title === prevInfo.title && curInfo.usage === prevInfo.usage)) {
                            prevInfo = collectInfo();

                            // Don't add duplicates
                            let isDuplicate = false;
                            for (let dataPoint of data) {
                                if (prevInfo.title === dataPoint.title) isDuplicate = true;
                            }
                            if (!isDuplicate) {
                                data.push(prevInfo);
                            }

                            console.log(data);
                            if (count !== (endIndex - beginIndex + 1)) {
                                count++;
                                console.log(count + "/" + totalItems + " collected.");
                                moveToNext();
                            }
                            // We're all done, go to the next page
                            if (count + "" === endIndex || !$(".image-next-trigger>a").length) {
                                let csv = Papa.unparse(data);
                                let title = $(".content>.main_title")[0].innerText;
                                download(`PARTIAL_${title}_${beginIndex}_to_${endIndex}_of_${totalItems}.csv`, csv);
                                if (totalItems === endIndex) {
                                    let csv = Papa.unparse(data);
                                    let title = $(".content>.main_title")[0].innerText;
                                    download(`FINAL_${title}_${totalItems}_items.csv`, csv);
                                } else {
                                    $(".ui-icon-closethick")[0].click();
                                    $(".bottom.pager").find(".next>a")[0].click();
                                    var waitForNextPage = setInterval(() => {
                                        if (!$(".advf_loading.active").length) {
                                            console.log("Loader is gone");
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
