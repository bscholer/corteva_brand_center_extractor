let resultsRegex = /(\d+)-(\d+) of (\d+)/
let totalResults = $(".total_results>.summary")[0].innerText;

let beginIndex = totalResults.match(resultsRegex)[1];
let endIndex = totalResults.match(resultsRegex)[2];
let totalItems = totalResults.match(resultsRegex)[3];

let downloadButton = "<div><a id='download-results-button'>Download Results</a></div>"
$(".total_results>.sort-controls").after(downloadButton);
$("#download-results-button").on('click', () => {
    run()
});


function run() {
    alert("An automated script will now go through each result, capture the data, and download it as a CSV file.\nPlease DO NOT interact with the page until the CSV has been downloaded.\nDoing something else in another tab is OK.")
    let items = $(".items>tbody>tr")
    var data = [];
    if (items.length > 0) {
        $(items[0]).find(".description>a.info")[0].click();

        var checkExist = setInterval(function () {
            // rows = $("table.info_2>tbody").find("tr");
            if ($("table.info_2>tbody").find("tr").length) {
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
                    // Put it into data
                    return itemInfo;
                }
                let prevInfo = collectInfo();
                data.push(prevInfo);
                // Click next page button
                let moveToNext = () => {
                    $(".image-next-trigger>a")[0].click();
                    // Wait for it to be different
                    var checkDifferent = setInterval(function () {
                        let curInfo = collectInfo()
                        // console.log([prevInfo]);
                        if (!(curInfo.title === prevInfo.title && curInfo.size === prevInfo.size && curInfo.usage === prevInfo.usage)) {
                            prevInfo = collectInfo();
                            data.push(prevInfo);
                            // console.log(data);
                            if (data.length !== items.length) {
                                console.log(data.length + "/" + (endIndex - beginIndex + 1) + " collected.");
                                moveToNext();
                            }
                            // We're all done!
                            else {
                                let csv = Papa.unparse(data);
                                let title = $(".content>.main_title")[0].innerText;
                                download(`${title}_${beginIndex}_to_${endIndex}_of_${totalItems}.csv`, csv);
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
