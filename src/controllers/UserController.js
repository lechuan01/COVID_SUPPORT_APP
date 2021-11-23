// const Helper = require('./Helper');
const db = require('../config/db/DBconnection');
const bcrypt = require('bcrypt');
const { v1: uuidv1 } = require('uuid');

exports.showProfile = (req, res, next) => {
    let sql1 = "select id, last_name, first_name, date_of_birth, phone_number, avatar from `account` where phone_number = ?";
    db.query(sql1, [0936010094], (err, acc) => {
        if (err) throw err;
        if (acc.length > 0) {
            let sql2 = "select * from account_address where account_id = ?";
            db.query(sql2, [acc[0].id], (err, acc_address) => {
                if (err) throw err;
                // res.json(acc[0]);
                res.render('user/profile', { account: acc[0], address: acc_address });
            });
        }
        else {
            res.status(404).send("Can not found this account");
        }
    });
}

exports.updateAvatar = async (req, res, next) => {
    if (req.files) {
        let sampleFile = req.files.avatar;
        let uploadPath = './src/public/upload/avatar_user/' + sampleFile.name;
        sampleFile.mv(uploadPath, (err) => {
            if (err) return res.status(500).send(err);
            let sql = 'update account SET avatar = ? where phone_number = ?';
            db.query(sql, [sampleFile.name, '0936010094'], (err, result) => {
                if (err) throw err;
                if (result) {
                    res.redirect('/profile');
                }
            })
        });
    }
}
exports.updateProfile = async (req, res, next) => {
    if (req.body) {
        const profile = {
            lastName: req.body.lastName,
            firstName: req.body.firstName,
            birthDay: req.body.birthDay,
            address: null
        }
        if (req.body.street && req.body.ward && req.body.district) {
            profile.address = `${req.body.street}, ${req.body.ward}, ${req.body.district}, Thành phố Hồ Chí Minh`;
        }
        let sql1 = "select id from account where phone_number = ?";

        //TODO: Change phone number to user phone number in session
        db.query(sql1, ['0936010094'], (err, _id) => {
            if (err) throw err;
            const id = _id[0].id;
            let sql2 = "update account set last_name = ?, first_name = ?, date_of_birth = ? where id = ?";
            db.query(sql2, [profile.lastName, profile.firstName, profile.birthDay, id], (err, result) => {
                if (err) throw err;
                if (profile.address) {
                    let sql3 = "set foreign_key_checks=0; insert into account_address set account_id = ?, address = ?; set foreign_key_checks=1;";
                    db.query(sql3, [id, profile.address], (err, result) => {
                        if (err) throw err;
                        res.json({ code: 200 });
                    });
                }
                else {
                    res.json({ code: 200 });
                }
            });
        });
    }






}
exports.login = (req, res, next) => {
    const userInput = {
        phoneNumber: req.body.phoneNumber,
        password: req.body.password
    }
    let sql = 'SELECT * FROM account WHERE phone_number = ?';
    db.query(sql, userInput.phoneNumber, (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            if (bcrypt.compareSync(userInput.password, result[0].password)) {
                req.session.user = result[0];

                if (result[0].role == 'admin') {
                    res.render('admin/dashboard');
                }
                else {
                    res.render('index');
                }
            }
            else {
                res.render('login', { message: "Password is wrong" });
            }
        }
        else {
            res.send('Account wasn\'t existed');
        }
    });

}
exports.register = (req, res, next) => {
    const userInput = {
        lastName: req.body.lastName,
        firstName: req.body.firstName,
        phoneNumber: req.body.phoneNumber,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        image: 'avatar-default.jpg'
    }

    // Find if at least one user stored in database
    let sql = 'SELECT * FROM account WHERE phone_number = ?';
    db.query(sql, userInput.phoneNumber, (err, result) => {
        if (err) throw err;
        // One or more user are found
        if (result.length > 0) {
            res.render('register', { message: "Số điện thoại này đã được sử dụng" });
        }

        if (userInput.password !== userInput.confirmPassword) {
            res.render('register', { message: "Mật khẩu không khớp" });
        }

        else {
            const id = uuidv1();
            const today = new Date();
            let createTime = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

            let pwd = userInput.password;
            userInput.password = bcrypt.hashSync(pwd, 10);
            let sql = 'INSERT INTO account (id, last_name, first_name, phone_number, password, create_time, avatar, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            db.query(sql, [id, userInput.lastName, userInput.firstName, userInput.phoneNumber, userInput.password, createTime, userInput.image, 'C'], (err, result) => {
                if (err) throw err;
                if (result) {
                    sql = "INSERT INTO customer SET account_id = ?;"
                    db.query(sql, [id], (err, result) => {
                        if (err) throw err;
                        if (result) {
                            res.render('login', { message: "Đăng ký tài khoản thành công" });
                        }
                    });

                }

            });
        }

    });
}

exports.volunteerRegistier = (req, res, next) => {
    const userInput = {
        lastName: req.body.lastName,
        firstName: req.body.firstName,
        phoneNumber: req.body.phoneNumber,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        image: 'avatar-default.jpg'
    }

    // Find if at least one user stored in database
    let sql = 'SELECT * FROM `account`, volunteer WHERE phone_number = ?;';
    db.query(sql, userInput.phoneNumber, (err, result) => {
        if (err) throw err;
        // One or more user are found
        if (result.length > 0) {
            res.render('register', { message: "Số điện thoại này đã được sử dụng" });
        }

        sql = "select * from `account`, volunteer where `account`.id = volunteer.account_id and volunteer.email = ?";
        db.query(sql, [userInput.email], (err, result) => {
            if (err) throw err;
            if (result.length > 0) {
                res.render('register', { message: "Email này đã được sử dụng" });
            }
        })

        if (userInput.password !== userInput.confirmPassword) {
            res.render('register', { message: "Mật khẩu không khớp" });
        }

        else {
            const id = uuidv1();
            const today = new Date();
            let createTime = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

            let pwd = userInput.password;
            userInput.password = bcrypt.hashSync(pwd, 10);
            let sql = 'INSERT INTO account (id, last_name, first_name, phone_number, password, create_time, avatar, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?);';
            db.query(sql, [id, userInput.lastName, userInput.firstName, userInput.phoneNumber, userInput.password, createTime, userInput.image, 'V'], (err, result) => {
                if (err) throw err;
                if (result) {
                    sql = "INSERT INTO volunteer SET email = ?, account_id = ?;"
                    db.query(sql, [userInput.email, id], (err, result) => {
                        if (err) throw err;
                        if (result) {
                            res.render('login', { message: "Đăng ký tài khoản tình nguyện viên thành công" });
                        }
                    });

                }

            });
        }

    });
}
exports.loggout = (req, res, next) => {
    // res.json("Loggout");
    if (req.session.user) {
        req.session.destroy(() => {
            req.session = null;
            res.redirect('/');
        });
    }
}