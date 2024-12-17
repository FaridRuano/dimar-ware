import connectMongoDB from "@libs/mongodb"
import User from "@models/userModal"
import { NextResponse } from "next/server"
import bcrypt from 'bcrypt';

export async function POST(request) {
    try {
        const { name, email, password, rol } = await request.json()

        await connectMongoDB()

        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return NextResponse.json(
                {
                    message: 'User already exists',
                    error: true
                },
                {
                    status: 200
                }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const status = true

        await User.create({ name, email, password: hashedPassword, rol, status })

        return NextResponse.json(
            {
                message: "User created"
            },
            {
                status: 200
            }
        )
    } catch (error) {
        return NextResponse.json(
            {
                message: "Something went wrong:", error
            },
            {
                status: 500
            }
        )
    }
}

export async function DELETE(request){
    try{

        const { id } = await request.json()

        await connectMongoDB()

        const result = await User.findOneAndDelete({ _id: id })
         
        if (result) {
            return NextResponse.json(
                { message: "User deleted successfully" },
                { status: 200 })
        } else {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 })
        }
    }catch (error) {
        return NextResponse.json(
            {
                message: "Something went wrong:", error
            },
            {
                status: 500
            }
        )
    }
}

export async function PUT(request) {
    try {
        const { action, id, name, email, status, rol } = await request.json()

        await connectMongoDB()

        const existingUser = await User.findById(id)

        if (!existingUser) {
            return NextResponse.json(
                {
                    message: "User not found",
                    error: true,
                },
                {
                    status: 404,
                }
            );
        }

        if(action === 'changeuser'){
            existingUser.name = name || existingUser.name
            existingUser.email = email || existingUser.email
            existingUser.rol = rol || existingUser.rol
            existingUser.status = status !== undefined ? status : existingUser.status
    
            await existingUser.save()
    
            return NextResponse.json(
                {
                    message: "User updated successfully",
                    user: {
                        id: existingUser._id,
                        name: existingUser.name,
                        email: existingUser.email,
                        rol: existingUser.rol,
                        status: existingUser.status,
                    },
                },
                {
                    status: 200,
                }
            )
        }else if(action === 'changestatus'){
            existingUser.status = status !== undefined ? status : existingUser.status

            await existingUser.save()
    
            return NextResponse.json(
                {
                    message: "User updated successfully",
                    user: {
                        id: existingUser._id,
                        name: existingUser.name,
                        email: existingUser.email,
                        rol: existingUser.rol,
                        status: existingUser.status,
                    },
                },
                {
                    status: 200,
                }
            )
        }

    } catch (error) {
        return NextResponse.json(
            {
                message: "Something went wrong:", error
            },
            {
                status: 500
            }
        )
    }
}

export async function GET(request) {
    try {
        await connectMongoDB()
        const data = await User.find().select("-password -createdAt -updatedAt -__v");

        return NextResponse.json(
            { data },
            {
                status: 200,
            }
        )
    } catch (error) {
        return NextResponse.json(
            {
                message: "Something went wrong:", error
            },
            {
                status: 500
            }
        )
    }
}
