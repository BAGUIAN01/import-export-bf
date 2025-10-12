import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'

// Import différent selon l'environnement
const isProduction = process.env.NODE_ENV === 'production'
let puppeteer, chromium

if (isProduction) {
  // En production (Vercel), utiliser puppeteer-core et chromium
  puppeteer = require('puppeteer-core')
  chromium = require('@sparticuz/chromium')
} else {
  // En développement, utiliser puppeteer complet
  puppeteer = require('puppeteer')
}

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

    // Générer le HTML
    const htmlContent = generateBordereauHTML(bordereauData);

    // Générer le PDF avec Puppeteer
    let browser;
    
    if (isProduction) {
      // Configuration pour Vercel avec Chromium
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      // Configuration pour développement local
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bordereau-${client.clientCode}-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error('Erreur génération bordereau:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du bordereau' },
      { status: 500 }
    );
  }
}

function generateBordereauHTML(data) {
  // Générer l'URL de tracking pour le QR code avec le numéro de shipment
  const trackingUrl = data.shipment?.shipmentNumber 
    ? `https://import-export-bf.vercel.app/tracking?q=${data.shipment.shipmentNumber}`
    : `https://import-export-bf.vercel.app/tracking`;

  // Numéro de shipment pour affichage
  const shipmentNumber = data.shipment?.shipmentNumber || 'N/A';

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bordereau d'Expédition - ${data.client.code}</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 10px;
          line-height: 1.35;
          color: #000;
          background: white;
        }
        
        .page {
          width: 210mm;
          height: 297mm;
          margin: 0 auto;
          background: white;
          display: flex;
          flex-direction: column;
        }
        
        /* En-tête épuré */
        .header {
          background: #010066;
          color: white;
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        
        .logo-container {
          background: white;
          padding: 7px;
          border-radius: 4px;
        }
        
        .logo-container img {
          width: 45px;
          height: 45px;
          object-fit: contain;
        }
        
        .company-details h1 {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .company-details p {
          font-size: 9px;
          opacity: 0.9;
        }
        
        .header-right {
          text-align: right;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        
        .bordereau-info {
          text-align: right;
        }
        
        .bordereau-number {
          font-size: 9px;
          opacity: 0.9;
        }
        
        .bordereau-number strong {
          display: block;
          font-size: 13px;
          font-weight: bold;
          margin-top: 2px;
        }
        
        .qr-code-container {
          background: white;
          padding: 5px;
          border-radius: 4px;
        }
        
        .qr-code-container img {
          width: 55px;
          height: 55px;
          display: block;
        }
        
        /* Bandeau conteneur */
        .container-banner {
          background: #f5f5f5;
          border-top: 2px solid #010066;
          border-bottom: 1px solid #ddd;
          padding: 8px 22px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          font-weight: 600;
        }
        
        /* Contenu principal */
        .content {
          flex: 1;
          padding: 16px 22px;
        }
        
        /* Section clients */
        .clients-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        
        .client-card {
          border: 1px solid #ddd;
          padding: 11px;
          background: #fafafa;
        }
        
        .client-card h3 {
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 7px;
          text-transform: uppercase;
          color: #010066;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
        }
        
        .client-card .info-line {
          margin-bottom: 4px;
          font-size: 9px;
        }
        
        .client-card .info-line .label {
          color: #666;
          display: inline-block;
          width: 55px;
        }
        
        .client-card .info-line .value {
          font-weight: 600;
          color: #000;
        }
        
        /* Section colis */
        .packages-section {
          margin-bottom: 14px;
        }
        
        .section-title {
          font-size: 11px;
          font-weight: bold;
          color: #010066;
          margin-bottom: 7px;
          padding-bottom: 4px;
          border-bottom: 2px solid #010066;
        }
        
        .packages-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          border: 1px solid #ddd;
        }
        
        .packages-table th {
          background: #010066;
          color: white;
          padding: 7px 5px;
          text-align: left;
          font-weight: bold;
          font-size: 9px;
        }
        
        .packages-table td {
          padding: 6px 5px;
          border-bottom: 1px solid #e0e0e0;
          vertical-align: top;
        }
        
        .packages-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .package-desc {
          font-weight: 600;
          font-size: 9px;
        }
        
        .package-types {
          font-size: 8px;
          color: #666;
          margin-top: 2px;
        }
        
        .status-badge {
          font-size: 8px;
          font-weight: bold;
        }
        
        /* Section totaux - Inline */
        .totals-section {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-bottom: 12px;
          padding: 10px;
          background: #f9f9f9;
          border: 1px solid #ddd;
        }
        
        .total-item {
          text-align: center;
          padding: 7px 14px;
          border-left: 2px solid #ddd;
        }
        
        .total-item:first-child {
          border-left: none;
        }
        
        .total-item .label {
          font-size: 8px;
          text-transform: uppercase;
          font-weight: bold;
          color: #666;
          margin-bottom: 4px;
        }
        
        .total-item .amount {
          font-size: 16px;
          font-weight: bold;
          color: #000;
        }
        
        .total-item.remaining .amount {
          color: #010066;
        }
        
        /* Conditions */
        .conditions {
          background: #fafafa;
          border: 1px solid #ddd;
          padding: 7px 9px;
          margin-bottom: 11px;
          font-size: 8px;
          line-height: 1.4;
        }
        
        .conditions strong {
          display: block;
          margin-bottom: 4px;
          font-size: 9px;
        }
        
        .conditions p {
          margin: 2px 0;
        }
        
        /* Pied de page */
        .footer {
          padding-top: 9px;
          border-top: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          font-size: 8px;
          color: #666;
        }
        
        .footer-left p {
          margin: 2px 0;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-box .label {
          margin-bottom: 4px;
          font-weight: bold;
          color: #000;
          font-size: 9px;
        }
        
        .signature-box .line {
          width: 130px;
          height: 35px;
          border-bottom: 1px solid #000;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .amount-value {
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- En-tête avec logo et QR code -->
        <div class="header">
          <div class="header-left">
            <div class="logo-container">
              ${data.logo ? `<img src="${data.logo}" alt="Logo" />` : ''}
            </div>
            <div class="company-details">
              <h1>IMPORT EXPORT BF</h1>
              <p>📞 +33 6 70 69 98 23 • +226 76 60 19 81 • contact@ieBF.fr</p>
            </div>
          </div>
          <div class="header-right">
            <div class="bordereau-info">
              <div class="bordereau-number">
                Shipment N°
                <strong>${shipmentNumber}</strong>
              </div>
              <p style="font-size: 8px; margin-top: 3px;">Date: ${data.generatedAt.split(',')[0]}</p>
            </div>
            <div class="qr-code-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=55x55&data=${encodeURIComponent(trackingUrl)}" alt="QR Code Tracking" />
            </div>
          </div>
        </div>

        <!-- Bandeau conteneur -->
        ${data.packages[0]?.containerNumber ? `
        <div class="container-banner">
          <span>Conteneur: <strong>${data.packages[0].containerNumber}</strong></span>
          ${data.packages[0].departureDate ? `<span>Départ: <strong>${new Date(data.packages[0].departureDate).toLocaleDateString('fr-FR')}</strong></span>` : ''}
          <span>${data.totals.totalPackages} colis</span>
          ${data.shipment?.shipmentNumber ? `<span>Suivi: <strong>${data.shipment.shipmentNumber}</strong></span>` : ''}
        </div>
        ` : ''}

        <div class="content">
          <!-- Section Clients -->
          <div class="clients-section">
            <div class="client-card">
              <h3>Expéditeur</h3>
              <div class="info-line">
                <span class="label">Code:</span>
                <span class="value">${data.client.code}</span>
              </div>
              <div class="info-line">
                <span class="label">Nom:</span>
                <span class="value">${data.client.name}</span>
              </div>
              <div class="info-line">
                <span class="label">Tél:</span>
                <span class="value">${data.client.phone}</span>
              </div>
              <div class="info-line">
                <span class="label">Adresse:</span>
                <span class="value">${data.client.address}, ${data.client.city}</span>
              </div>
            </div>

            <div class="client-card">
              <h3>Destinataire</h3>
              <div class="info-line">
                <span class="label">Nom:</span>
                <span class="value">${data.client.recipientName || 'Non renseigné'}</span>
              </div>
              <div class="info-line">
                <span class="label">Tél:</span>
                <span class="value">${data.client.recipientPhone || 'Non renseigné'}</span>
              </div>
              <div class="info-line">
                <span class="label">Adresse:</span>
                <span class="value">${data.client.recipientAddress || 'Non renseignée'}${data.client.recipientCity ? `, ${data.client.recipientCity}` : ''}</span>
              </div>
            </div>
          </div>

          <!-- Section Colis -->
          <div class="packages-section">
            <div class="section-title">Détail des colis (${data.totals.totalPackages})</div>
            <table class="packages-table">
              <thead>
                <tr>
                  <th style="width: 18%;">N° Colis</th>
                  <th style="width: 35%;">Description</th>
                  <th style="width: 7%;">Qté</th>
                  <th style="width: 10%;">Montant</th>
                  <th style="width: 10%;">Payé</th>
                  <th style="width: 10%;">Reste</th>
                  <th style="width: 10%;">Statut</th>
                </tr>
              </thead>
              <tbody>
                ${data.packages.map(pkg => `
                  <tr>
                    <td><strong>${pkg.packageNumber}</strong></td>
                    <td>
                      <div class="package-desc">${pkg.description}</div>
                      ${pkg.types.length > 0 ? `<div class="package-types">${pkg.types.map(t => `${t.type} (×${t.quantity})`).join(', ')}</div>` : ''}
                    </td>
                    <td class="text-center">${pkg.totalQuantity || 0}</td>
                    <td class="text-right amount-value">${(pkg.totalAmount || 0).toFixed(2)}€</td>
                    <td class="text-right amount-value">${(pkg.paidAmount || 0).toFixed(2)}€</td>
                    <td class="text-right amount-value">${pkg.remainingAmount.toFixed(2)}€</td>
                    <td class="text-center">
                      <span class="status-badge">${pkg.paymentStatus === 'PAID' ? '✓' : pkg.paymentStatus === 'PARTIAL' ? '○' : '✗'}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Section Totaux inline -->
          <div class="totals-section">
            <div class="total-item">
              <div class="label">Total Général</div>
              <div class="amount">${data.totals.totalAmount.toFixed(2)}€</div>
            </div>
            <div class="total-item">
              <div class="label">Montant Payé</div>
              <div class="amount">${data.totals.totalPaid.toFixed(2)}€</div>
            </div>
            <div class="total-item remaining">
              <div class="label">Reste à Payer</div>
              <div class="amount">${data.totals.remainingAmount.toFixed(2)}€</div>
            </div>
          </div>

          <!-- Conditions -->
          <div class="conditions">
            <strong>CONDITIONS</strong>
            <p>• Marchandises non précisées ne pourront être réclamées • Valeurs justifiées par facture</p>
            <p>• Livraison optionnelle déterminée avant départ • Sous réserve procédures douanières</p>
          </div>

          <!-- Pied de page -->
          <div class="footer">
            <div class="footer-left">
              <p>Document généré le ${data.generatedAt} par ${data.generatedBy}</p>
              <p>IMPORT EXPORT BF - Service d'envoi de colis France-Burkina Faso</p>
            </div>
            <div class="signature-box">
              <div class="label">Signature</div>
              <div class="line"></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
