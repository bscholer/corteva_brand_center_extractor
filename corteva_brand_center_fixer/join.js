var fs = require("fs");
var Papa = require("papaparse");

var countries = [];
var noDupesLogos = [];
var productTypes = ["Fungicide", "Herbicide", "Insecticide", "Nematicide", "Nitrogen Stabilizer", "Seed Treatment"];
fs.readFile(".\\FINAL_Packing_Logos.csv", function (err, data) {
    // console.log(data.toString());
    Papa.parse(data.toString(), {
        header: true,
        complete: function (results) {
            let logos = results.data;

            fs.readFile(".\\countries.csv", function (err, data) {
                let preCountries = Papa.parse(data.toString());
                preCountries = preCountries.data[0];
                // console.log(preCountries);
                for (let country of preCountries) {
                    // console.log("country = " + country);
                    // console.log(country.match(/\|([A-Za-z]+)/));
                    countries.push(country.match(/\|(.+)/)[1]);
                }

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

                console.log(logos.length);
                noDupesLogos.push(logos[0]);
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

                console.log(noDupesLogos.length);

                let cnt = 0;
                for (let nodupe of noDupesLogos) {
                    if (nodupe["product_category"]) cnt++;
                    // else console.log(nodupe.tags);
                }
                console.log(cnt);

                let finishedCsv = Papa.unparse(noDupesLogos);
                fs.writeFile("FINAL_Packing_Logos_no_duplicates.csv", finishedCsv, function (err) {
                    console.log("rip");
                });

            })
        }
    })
})

function equals(logo1, logo2) {
    if (logo1.title === logo2.title) {
        return true;
    }
    return false;
}