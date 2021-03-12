const router = require('express').Router();
const verify = require('./verifyToken');

router.get('/', verify, (req, res) => {
    res.json({ posts: { title: "Hello JWT", description: "This is JET authorized" } })
});

module.exports = router;