import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'
import { authController } from './auth.controller'

const router = Router()

router.post('/register', asyncHandler(authController.register))
router.post('/login', asyncHandler(authController.login))
router.post('/refresh', asyncHandler(authController.refreshToken))
router.post('/logout', authenticate, asyncHandler(authController.logout))
router.get('/me', authenticate, asyncHandler(authController.getMe))
router.put('/me', authenticate, asyncHandler(authController.updateMe))
router.put('/change-password', authenticate, asyncHandler(authController.changePassword))
router.post('/forgot-password', asyncHandler(authController.forgotPassword))
router.post('/reset-password', asyncHandler(authController.resetPassword))

router.get('/users', authenticate, requireRole('admin'), asyncHandler(authController.getUsers))
router.post('/users', authenticate, requireRole('admin'), asyncHandler(authController.createUser))
router.get('/users/:id', authenticate, requireRole('admin'), asyncHandler(authController.getUser))
router.put('/users/:id', authenticate, requireRole('admin'), asyncHandler(authController.updateUser))
router.delete('/users/:id', authenticate, requireRole('admin'), asyncHandler(authController.deleteUser))

export default router
