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

        const planetsUrl = 'https://swapi.co/api/planets';
        const peopleUrl = 'https://swapi.co/api/people';

        const getPlanetDataWrapper = (url) => {
            return new Promise((resolve, reject) => {
                var planets = [];

                const getPlanetData = (url) => {
                    getData(url).then((data) => {
                        planets = planets.concat(data.results);

                        if (data.next !== null) {
                            getPlanetData(data.next);
                        }
                        else {
                            resolve(planets);
                        }
                    })
                    .catch((err) => {
                        console.log('Star Wars API is down');
                        reject(err);
                    });
                };

                getPlanetData(url);
            });
        };

        const planetsPromise = getPlanetDataWrapper(planetsUrl);
        const peoplePromise = getPlanetDataWrapper(peopleUrl);

        Promise.all([planetsPromise, peoplePromise]).then(function(data) {
            const planetsArr = data[0];
            const peopleArr = data[1];
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

program.parse(process.argv);