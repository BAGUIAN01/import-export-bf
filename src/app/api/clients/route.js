import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ message: "Permissions insuffisantes" }, { status: 403 });
    }

    const clients = await prisma.client.findMany({
      include: {
        packages: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
          },
        },
        _count: {
          select: {
            packages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Erreur récupération clients:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des clients" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ message: "Permissions insuffisantes" }, { status: 403 });
    }

    const body = await request.json();

    // Validation des champs obligatoires
    const requiredFields = [
      'firstName', 'lastName', 'phone', 'address', 'city',
      'recipientName', 'recipientPhone', 'recipientAddress', 'recipientCity'
    ];
    
    for (const field of requiredFields) {
      if (!body[field] || body[field].trim() === '') {
        return NextResponse.json(
          { message: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Vérification unicité du téléphone
    const existingClient = await prisma.client.findFirst({
      where: { phone: body.phone }
    });

    if (existingClient) {
      return NextResponse.json(
        { message: "Un client avec ce numéro de téléphone existe déjà" },
        { status: 400 }
      );
    }

    // Génération du code client unique
    const lastClient = await prisma.client.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { clientCode: true }
    });

    let nextNumber = 1;
    if (lastClient && lastClient.clientCode) {
      const match = lastClient.clientCode.match(/CLI(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const clientCode = `CLI${nextNumber.toString().padStart(3, '0')}`;

    // Création du client
    const client = await prisma.client.create({
      data: {
        clientCode,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        address: body.address.trim(),
        city: body.city.trim(),
        country: body.country || 'France',
        postalCode: body.postalCode?.trim() || null,
        company: body.company?.trim() || null,
        siret: body.siret?.trim() || null,
        recipientName: body.recipientName.trim(),
        recipientPhone: body.recipientPhone.trim(),
        recipientEmail: body.recipientEmail?.trim() || null,
        recipientAddress: body.recipientAddress.trim(),
        recipientCity: body.recipientCity.trim(),
        recipientRelation: body.recipientRelation?.trim() || null,
        isVip: !!body.isVip,
        creditLimit: body.creditLimit || 0,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json({
      message: "Client créé avec succès",
      client,
    });
  } catch (error) {
    console.error("Erreur création client:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }
}