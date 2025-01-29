import connectMongoDB from "@libs/mongodb"
import User from "@models/userModal"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextResponse } from "next/server"

export async function POST(request) {
    try {
        const { email, password } = await request.json()

        await connectMongoDB()

        const user = await User.findOne({ email, status: true }).select('+password')

        if (!user) {
            return NextResponse.json(
                {
                    message: 'User not found',
                },
                {
                    status: 404
                }
            )
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return NextResponse.json(
                {
                    message: 'Invalid credentials',
                },
                {
                    status: 401
                }
            )
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, name:user.name, rol: user.rol, status: user.status},
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )

        return NextResponse.json(
            {
                token,
                message: 'Login succesfully'
            },
            {
                status: 200
            }
        )
    } catch (error) {
        return NextResponse.json(
            {
                message: 'Error interno',
                error
            },
            {
                status: 500
            }
        )
    }
}
