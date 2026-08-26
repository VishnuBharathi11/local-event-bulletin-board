const express = require('express')
const { register, login, logout, me, updateProfile } = require('../controllers/authController')
const { attachUser } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/auth/register', register)
router.post('/auth/login', login)
router.post('/auth/logout', logout)
router.get('/auth/me', attachUser, me)
router.patch('/auth/profile', attachUser, updateProfile)

module.exports = router
