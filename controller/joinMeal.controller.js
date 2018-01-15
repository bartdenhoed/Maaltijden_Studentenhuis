var connection = require('../config/connection');

module.exports = {    
    joinMealById(req, res, next) {
        var body = req.body;

        if (
            (typeof body.meal_id !== 'undefined' && body.meal_id) &&
            (typeof body.user_id !== 'undefined' && body.user_id) &&
            (typeof body.guest_amount !== 'undefined')
        ){
            //Add yourself as guest
            body.guest_amount++;
            
            // Check user already joined
            if (!checkUserAlreadyJoined(body.meal_id, body.user_id)) {
                res.status(400).json({
                    status: {
                        message: 'User already joined'
                    }
                }).end();
                return false;
            };
            
            checkMaxAmount(body.meal_id, body.guest_amount, (lessThanMax) => {
                if(!lessThanMax){
                    res.status(400).json({
                        status: {
                            message: 'Max amount guests'
                        }
                    }).end();
                    return false;
                }else{
                    // Join meal
                    var query = 'INSERT INTO meals_users SET ?';

                    connection.query(query, {meal_id: body.meal_id, user_id: body.user_id, guest_amount: body.guest_amount}, function (error, rows, fields) {
                        if (error) {
                            next(error);
                        } else {
                            res.status(200).json({
                                status: {
                                    message: 'OK'
                                },
                                result: rows
                            }).end();
                            return false;
                        };
                    });
                }
            });
        } else {
            res.status(500).json({
                status: {
                    message: 'ERROR'
                }
            }).end();  
            return false; 
        };
    }
};

function checkUserAlreadyJoined(meal_id, user_id) {
    var query = 'SELECT id FROM meals_users WHERE meal_id = ? AND user_id = ? LIMIT 1';

    return connection.query(query, [meal_id, user_id], function (error, rows, fields) {
        if (error) {
            console.log(error);
            return false;
        } else if (rows.length != 1) {
            return false;
        } else {
            return true;
        }
    });
}

function checkMaxAmount(meal_id, guest_amount, callback) {
    var query = 'SELECT guest_amount FROM meals_users WHERE meal_id = ?';

    connection.query(query, meal_id, function (error, rows, fields) {
        if (error) {
            console.log(error);
            return false;
        } else {
            // Count all signup guests
            var total_amount = 0;

            rows.forEach(function(row) {
                total_amount += row.guest_amount;
            });
            
            getMeal(meal_id).then((meal) => {
                if (meal.max_amount >= (total_amount + guest_amount)) {
                    callback(true);
                } else {
                    callback(false);
                };
            }).catch((error) => {
                console.log(error);
                callback(false);
            });
        }
    });
}

function getMeal(meal_id) {
    return new Promise(
        function(resolve, reject){
            var query = 'SELECT id, title, description, datetime, image, max_amount, user_id FROM meals WHERE id = ? LIMIT 1';
    
            connection.query(query, meal_id, function (error, rows, fields) {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    resolve(rows[0]);
                }
            });
        }
    )
    
}