import connectMongoDB from "@libs/mongodb"
import Client from "@models/clientModel"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {

        await connectMongoDB()

        const url = request.nextUrl

        /* Params */
        const page = parseInt(url.searchParams.get('page')) || 1
        const limit = parseInt(url.searchParams.get('limit')) || 10
        const term = url.searchParams.get('term') || null

        const skip = (page - 1) * limit

        let query = {}

        if (term !== null) {
            query.name = { $regex: term, $options: 'i' };
        }

        const totalCli = await Client.countDocuments()

        let clients

        let totalPages

        clients = await Client.find(query, "-user -createdAt -updatedAt -__v")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec()

        totalPages = Math.ceil(totalCli / limit)


        return NextResponse.json(
            {
                data: clients,
                totalPages: totalPages,
                currentPage: page,
                totalCli: totalCli
            },
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

export async function POST(request) {
    try {
        const { type, dni, name, email, address, phone, user } = await request.json()

        await connectMongoDB()

        const existingCli = await Client.findOne({ dni })

        if (existingCli) {
            return NextResponse.json(
                {
                    message: 'Client already exists',
                    error: true
                },
                {
                    status: 200
                }
            )
        }

        await Client.create({ type, dni, name, email, address, phone, user })

        return NextResponse.json(
            {
                message: "Client created"
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

export async function PUT(request) {
    try {
        const { id, type, dni, name, email, address, phone } = await request.json()

        await connectMongoDB()

        const existingCli = await Client.findById(id)

        if (!existingCli) {
            return NextResponse.json(
                {
                    message: "Client not found",
                    error: true,
                },
                {
                    status: 404,
                }
            );
        }

        existingCli.type = type || existingCli.type
        existingCli.dni = dni || existingCli.dni
        existingCli.name = name || existingCli.name
        existingCli.email = email || existingCli.email
        existingCli.address = address || existingCli.address
        existingCli.phone = phone || existingCli.phone

        await existingCli.save()

        return NextResponse.json(
            {
                message: "Client updated successfully",
                client: {
                    id: existingCli._id,
                    type: existingCli.type,
                    dni: existingCli.dni,
                    name: existingCli.name,
                    email: existingCli.email,
                    address: existingCli.address,
                    phone: existingCli.phone,
                },
            },
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

export async function DELETE(request) {
    try {

        const { id } = await request.json()

        await connectMongoDB()

        const result = await Client.findOneAndDelete({ _id: id })

        if (result) {
            return NextResponse.json(
                { message: "Client deleted successfully" },
                { status: 200 })
        } else {
            return NextResponse.json(
                { message: "Client not found" },
                { status: 404 })
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