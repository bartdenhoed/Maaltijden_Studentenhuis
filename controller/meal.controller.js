var connection = require('../config/connection');
var path = require('path');
var fs = require('fs');

module.exports = {
    getAll(req, res, next) {
        var query = 'SELECT * FROM meals';
        
        connection.query(query, function (error, rows, fields) {
            if (error) {
                next(error);
            } else {
                res.status(200).json({
                    status: {
                        query: 'OK'
                    },
                    result: rows
                }).end();
            };
        });
    },
    
    getById(req, res, next) {
        const id = req.params.id;
        
        var query = 'SELECT * FROM meals WHERE id=' + id;
        
        connection.query(query, function (error, rows, fields) {
            if (error) {
                next(error);
            } else {
                res.status(200).json({
                    status: {
                        query: 'OK'
                    },
                    result: rows
                }).end();
            };
        });
        // res.end();
    },

    newMeal(req, res, next) {
        var newMealReq = req.body;

        if(newMealReq.user == undefined){
            res.status(400).json({
                status: {
                    query: 'Bad Request: User has to be defined'
                }
            }).end();
        }

        var query = 'SELECT * FROM users WHERE id=' + newMealReq.user;

        connection.query(query, function (error, rows, fields) {
            if(error){
                next(error);
            } else if(rows.length != 1) {
                res.status(400).json({
                    status: {
                        query: 'Bad Request: User does not exist'
                    }
                }).end();
            }else{
                if(!checkNewMealReq(newMealReq)){
                    return false;
                }

                insertNewMeal(req.file, newMealReq, res);              
            }
        });
    }
};

function checkNewMealReq(newMealReq){
    var date = new Date(newMealReq.datetime);
    var curDate = new Date();
    
    if(curDate > date || newMealReq.title == undefined || newMealReq.desc == undefined || newMealReq.max_people < 2){
        return false;
    }
    return true;
}

function insertNewMeal(newMealImg, newMealReq, res){
    connection.query('INSERT INTO meals SET ?', {title: newMealReq.title, description: newMealReq.desc, datetime: newMealReq.datetime, max_amount: newMealReq.max_people, user_id: newMealReq.user}, function (error, results, fields) {
        if(error){
            console.log(error);
            res.status(500).json({
                status: {
                    query: 'Internal Server Error: Could not insert meal'
                }
            }).end();
        } else if(results.affectedRows < 1) {
            console.log('Affected rows less than 1.');

            res.status(500).json({
                status: {
                    query: 'Internal Server Error: Could not insert meal'
                }
            }).end();
        }else{
            handleNewMealImg(newMealImg, newMealReq, res, results.insertId);
        }
    });
}

function handleNewMealImg(newMealImg, newMealReq, res, mealId){
    var imgName = 'undefined.png';
    if(newMealImg != undefined){
        var tempPath = newMealImg.path;
        var extension = newMealImg.originalname.split('.').pop();

        var imgDate = new Date(newMealReq.datetime);
        var imgDateStr = imgDate.toISOString();
        imgName = imgDateStr + '_' + newMealReq.user + '_' + newMealReq.title + '.' + extension;

        var targetPath = path.resolve('./uploads/meal_img/' + imgName);

        checkFileUploaded(tempPath, () =>{
            console.log(3);
            insertImgDb(tempPath, targetPath, imgName, mealId, res);
        });
    }
}

//Onderstaand werkt nog niet
function checkFileUploaded(tempPath, callback){
    fs.access(tempPath, (err) => {
        if(err){
            setTimeout(() => { console.log(1); checkFileUploaded(tempPath, callback); }, 250);
        }else{
            console.log(2);
            callback();
        }
    });
}

function insertImgDb(tempPath, targetPath, imgName, mealId, res){
    fs.rename(tempPath, targetPath, function(error){
        if(error) {
            console.log(error);
            connection.query('UPDATE meals SET image = ? WHERE id = ?', ['undefined.png', mealId], function (error, results, fields) {
                if(error){
                    console.log(error);
                    res.status(500).json({
                        status: {
                            query: 'Internal Server Error: Could not insert image. Meal created with NULL image.'
                        }
                    }).end();
                } else if(results.affectedRows < 1) {
                    console.log('Affected rows less than 1.');
        
                    res.status(500).json({
                        status: {
                            query: 'Internal Server Error: Could not insert image. Meal created with NULL image.'
                        }
                    }).end();
                }else{            
                    res.status(500).json({
                        status: {
                            query: 'Internal Server Error: Could not insert image. Meal created with unknown image.'
                        }
                    }).end();
                }
            });
        }else{
            connection.query('UPDATE meals SET image = ? WHERE id = ?', [imgName, mealId], function (error, results, fields) {
                if(error){
                    console.log(error);
                    res.status(500).json({
                        status: {
                            query: 'Internal Server Error: Could not insert image. Meal created with NULL image.'
                        }
                    }).end();
                } else if(results.affectedRows < 1) {
                    console.log('Affected rows less than 1.');
        
                    res.status(500).json({
                        status: {
                            query: 'Internal Server Error: Could not insert image. Meal created with NULL image.'
                        }
                    }).end();
                }else{            
                    res.status(200).json({
                        status: {
                            query: 'OK'
                        }
                    }).end();
                }
            });
        }
    });
}