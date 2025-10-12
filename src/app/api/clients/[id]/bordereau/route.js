import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID client requis' },
        { status: 400 }
      );
    }

    // Récupération du client avec ses colis et statistiques
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        packages: {
          orderBy: { createdAt: "desc" },
          include: {
            shipment: {
              select: {
                id: true,
                shipmentNumber: true,
                container: {
                  select: {
                    containerNumber: true,
                    name: true,
                    departureDate: true,
                    arrivalDate: true,
                    status: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    // Calcul des totaux
    const totalPackages = client.packages.length;
    const totalAmount = client.packages.reduce((sum, pkg) => sum + (pkg.totalAmount || 0), 0);
    const totalPaid = client.packages.reduce((sum, pkg) => sum + (pkg.paidAmount || 0), 0);
    const remainingAmount = totalAmount - totalPaid;

    // Récupérer le shipment ID du premier package (tous les packages du même client/conteneur sont dans le même shipment)
    const shipmentId = client.packages[0]?.shipment?.id;
    const shipmentTrackingNumber = client.packages[0]?.shipment?.shipmentNumber;

    // Lire le logo en base64
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    let logoBase64 = '';
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('Logo non trouvé, utilisation d\'un placeholder');
      logoBase64 = ''; // On mettra juste le texte si le logo n'existe pas
    }

    // Préparer les données pour le template
    const bordereauData = {
      client: {
        code: client.clientCode,
        name: `${client.firstName} ${client.lastName}`,
        phone: client.phone,
        email: client.email,
        address: client.address,
        city: client.city,
        country: client.country,
        recipientName: client.recipientName,
        recipientPhone: client.recipientPhone,
        recipientAddress: client.recipientAddress,
        recipientCity: client.recipientCity
      },
      shipment: {
        id: shipmentId,
        shipmentNumber: shipmentTrackingNumber
      },
      packages: client.packages.map(pkg => ({
        packageNumber: pkg.packageNumber,
        description: pkg.description,
        types: JSON.parse(pkg.types || '[]'),
        totalQuantity: pkg.totalQuantity,
        weight: pkg.weight,
        totalAmount: pkg.totalAmount,
        paidAmount: pkg.paidAmount,
        remainingAmount: (pkg.totalAmount || 0) - (pkg.paidAmount || 0),
        paymentStatus: pkg.paymentStatus,
        status: pkg.status,
        createdAt: pkg.createdAt,
        containerNumber: pkg.shipment?.container?.containerNumber,
        containerName: pkg.shipment?.container?.name,
        departureDate: pkg.shipment?.container?.departureDate,
        arrivalDate: pkg.shipment?.container?.arrivalDate
      })),
      totals: {
        totalPackages,
        totalAmount,
        totalPaid,
        remainingAmount
      },
      generatedAt: new Date().toLocaleString('fr-FR'),
      generatedBy: client.user ? `${client.user.firstName} ${client.user.lastName}` : 'Système',
      logo: logoBase64
    };

    // Retourner les données JSON
    return NextResponse.json(bordereauData, { status: 200 });

  } catch (error) {
    console.error('Erreur génération bordereau:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du bordereau' },
      { status: 500 }
    );
  }
}
