#!/usr/bin/env node

const program = require('commander');
const { prompt } = require('inquirer');
// const { getContact } = require('./logic');
const axios = require('axios');

const questions = [
    {
        type : 'input',
        name : 'residents',
        message : 'Enter a planet!'
    }
];

program
    .version('0.0.1')
    .description('Contact management system');

program
    .command('getResidents')
    .alias('gR')
    .description("Input a planet and we'll return its residents")
    .action(() => {
        const planetsKV = {};

        const getResidents = (planet) => {
            console.log(planetsKV[planet.residents]);
        };

        const getData = (url) => {
            return new Promise((resolve, reject) => {
                axios.get(url)
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (error) {
                    reject(error);
                });
            });
        };

        const planetsUrl = 'https://swapi.co/api/planets/?page=';
        const peopleUrl = 'https://swapi.co/api/people/?page=';

        const getObjects = (url, count) => {
            const numPages = Math.ceil(count/10);
            let promiseArray = [];

            for (let i = 1; i <= numPages; i++) {
                promiseArray.push(getData(url + i));
            }

            return promiseArray;
        };

        const planetPromise = getData(planetsUrl);
        const peoplePromise = getData(peopleUrl);

        Promise.all([planetPromise, peoplePromise]).then(function(data) {
            const planetPromises = getObjects(planetsUrl, data[0].count);
            const peoplePromises = getObjects(peopleUrl, data[1].count);

            Promise.all(planetPromises).then(function(pagesOfPlanetData) {
                let planetsArr = [];
                for (let i = 0; i < pagesOfPlanetData.length; i++) {
                    planetsArr = planetsArr.concat(pagesOfPlanetData[i].results);
                }

                Promise.all(peoplePromises).then(function(pagesPeopleOfData) {
                    let peopleArr = [];
                    for (let i = 0; i < pagesPeopleOfData.length; i++) {
                        peopleArr = peopleArr.concat(pagesPeopleOfData[i].results);
                    }

                    const peopleKV = {};

                    for (var i = 0; i < peopleArr.length; i++) {
                        peopleKV[peopleArr[i].url] = peopleArr[i].name;
                    }

                    for (var i = 0; i < planetsArr.length; i++) {
                        for (var j = 0; j < planetsArr[i].residents.length; j++) {
                            planetsArr[i].residents[j] = peopleKV[planetsArr[i].residents[j]];
                        }
                        planetsKV[planetsArr[i].name] = planetsArr[i].residents;
                    }

                    prompt(questions).then(userInputtedPlanetName =>
                        getResidents(userInputtedPlanetName)
                    );
                });
            });
        });
    });

program.parse(process.argv);