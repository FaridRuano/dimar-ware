import Client from "@models/clientModel";
import connectMongoDB from "@libs/mongodb"
import { NextResponse } from "next/server"

export async function GET(request) {

    await connectMongoDB()

    const url = request.nextUrl

    const dni = url.searchParams.get('dni') || null
    const reason = url.searchParams.get('reason') || null

    let clients = []

    if(dni !== null){
        clients = await Client.find({
            dni: { $regex: dni, $options: 'i' }

          }).limit(3)
      
          return NextResponse.json(
            {
                data: clients
            },
            {
                status: 200
            }
        )
    }else if(reason !== null){
        clients = await Client.find({
            name: { $regex: reason, $options: 'i' }
          }).limit(3);
      
          return NextResponse.json(
            {
                data: clients
            },
            {
                status: 200
            }
        )
    }


    return NextResponse.json(
        {
            data: clients
        },
        {
            status: 200
        }
    )
}
