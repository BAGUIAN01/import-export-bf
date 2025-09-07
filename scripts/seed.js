// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Données de base
const frenchCities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille'];
const burkinaCities = ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya', 'Pouytenga', 'Dédougou', 'Fada N\'gourma', 'Kaya', 'Tenkodogo'];

const packageTypes = ['CARTON', 'BARRIQUE', 'ELECTRONICS', 'CLOTHING', 'FOOD', 'DOCUMENTS', 'OTHER'];
const packageStatuses = ['REGISTERED', 'COLLECTED', 'IN_CONTAINER', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED'];
const containerStatuses = ['PREPARATION', 'LOADED', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED'];
const paymentMethods = ['CASH', 'CARD', 'TRANSFER', 'MOBILE_MONEY'];

// Génération de données aléatoires
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Génération de noms français et africains
const frenchFirstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Michel', 'Catherine', 'Nicolas', 'Anne', 'Laurent', 'Isabelle', 'David', 'Sylvie', 'Christophe', 'Françoise', 'Philippe'];
const frenchLastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David'];

const africanFirstNames = ['Aminata', 'Moussa', 'Fatima', 'Ibrahim', 'Aïcha', 'Ousmane', 'Mariam', 'Seydou', 'Kadiatou', 'Mamadou', 'Fatoumata', 'Amadou', 'Rokia', 'Souleymane', 'Awa'];
const africanLastNames = ['Traoré', 'Ouedraogo', 'Kone', 'Sawadogo', 'Compaoré', 'Zongo', 'Sankara', 'Tapsoba', 'Nacro', 'Sana', 'Somé', 'Kaboré', 'Dao', 'Sorgho', 'Bambara'];

async function main() {
  console.log('🌱 Début du seeding...');

  // Nettoyage de la base de données
  console.log('🧹 Nettoyage de la base de données...');
  await prisma.file.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.trackingUpdate.deleteMany();
  await prisma.package.deleteMany();
  await prisma.container.deleteMany();
  await prisma.client.deleteMany();
  await prisma.pricing.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.phoneVerification.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // 1. Création des utilisateurs
  console.log('👥 Création des utilisateurs...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      phone: '+33123456789',
      email: 'admin@expeditions.fr',
      password: hashedPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'Système',
      name: 'Admin Système',
      city: 'Paris',
      country: 'France',
      isActive: true,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });

  // Création d'utilisateurs clients
  const clientUsers = [];
  for (let i = 0; i < 5; i++) {
    const firstName = randomElement(frenchFirstNames);
    const lastName = randomElement(frenchLastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;
    const phone = `+3316${randomInt(10000000, 99999999)}`;

    const user = await prisma.user.create({
      data: {
        phone,
        email,
        password: hashedPassword,
        role: 'CLIENT',
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        city: randomElement(frenchCities),
        country: 'France',
        isActive: true,
        emailVerified: new Date(),
        lastLoginAt: randomDate(new Date(2024, 0, 1), new Date()),
      },
    });
    clientUsers.push(user);
  }

  // 2. Création des clients
  console.log('👤 Création des clients...');
  const clients = [];
  
  // Clients liés aux utilisateurs
  for (let i = 0; i < clientUsers.length; i++) {
    const user = clientUsers[i];
    const recipientFirstName = randomElement(africanFirstNames);
    const recipientLastName = randomElement(africanLastNames);
    
    const client = await prisma.client.create({
      data: {
        clientCode: `CLI${String(i + 1).padStart(3, '0')}`,
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        address: `${randomInt(1, 999)} rue ${randomElement(['de la Paix', 'Victor Hugo', 'Jean Jaurès', 'des Roses', 'du Commerce'])}`,
        city: user.city,
        country: 'France',
        postalCode: `${randomInt(10000, 99999)}`,
        company: Math.random() > 0.7 ? `${randomElement(['SARL', 'SAS', 'EURL'])} ${randomElement(['Export', 'Trading', 'Import', 'Commerce'])}` : null,
        recipientName: `${recipientFirstName} ${recipientLastName}`,
        recipientPhone: `+22670${randomInt(100000, 999999)}`,
        recipientEmail: Math.random() > 0.5 ? `${recipientFirstName.toLowerCase()}@email.bf` : null,
        recipientAddress: `Secteur ${randomInt(1, 50)}, ${randomElement(['Tanghin', 'Cissin', 'Dapoya', 'Ouaga 2000', 'Zone du Bois'])}`,
        recipientCity: randomElement(burkinaCities),
        recipientRelation: randomElement(['Famille', 'Ami(e)', 'Conjoint(e)', 'Parent', 'Enfant', 'Frère/Sœur']),
        isVip: Math.random() > 0.8,
        creditLimit: randomFloat(0, 5000),
        totalSpent: randomFloat(0, 10000),
        notes: Math.random() > 0.7 ? 'Client régulier, très ponctuel dans ses paiements' : null,
      },
    });
    clients.push(client);
  }

  // Clients sans compte utilisateur
  for (let i = 5; i < 15; i++) {
    const firstName = randomElement(frenchFirstNames);
    const lastName = randomElement(frenchLastNames);
    const recipientFirstName = randomElement(africanFirstNames);
    const recipientLastName = randomElement(africanLastNames);
    
    const client = await prisma.client.create({
      data: {
        clientCode: `CLI${String(i + 1).padStart(3, '0')}`,
        firstName,
        lastName,
        phone: `+3316${randomInt(10000000, 99999999)}`,
        email: Math.random() > 0.3 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com` : null,
        address: `${randomInt(1, 999)} rue ${randomElement(['de la Paix', 'Victor Hugo', 'Jean Jaurès', 'des Roses', 'du Commerce'])}`,
        city: randomElement(frenchCities),
        country: 'France',
        postalCode: `${randomInt(10000, 99999)}`,
        recipientName: `${recipientFirstName} ${recipientLastName}`,
        recipientPhone: `+22670${randomInt(100000, 999999)}`,
        recipientEmail: Math.random() > 0.5 ? `${recipientFirstName.toLowerCase()}@email.bf` : null,
        recipientAddress: `Secteur ${randomInt(1, 50)}, ${randomElement(['Tanghin', 'Cissin', 'Dapoya', 'Ouaga 2000', 'Zone du Bois'])}`,
        recipientCity: randomElement(burkinaCities),
        recipientRelation: randomElement(['Famille', 'Ami(e)', 'Conjoint(e)', 'Parent', 'Enfant', 'Frère/Sœur']),
        isVip: Math.random() > 0.8,
        creditLimit: randomFloat(0, 5000),
        totalSpent: randomFloat(0, 10000),
      },
    });
    clients.push(client);
  }

  // 3. Création des tarifs
  console.log('💰 Création des tarifs...');
  const pricings = [
    {
      type: 'CARTON',
      name: 'Carton Standard',
      description: 'Carton de taille standard jusqu\'à 30kg',
      basePrice: 45.0,
      pickupFee: 15.0,
      perKgPrice: 1.5,
      minWeight: 0,
      maxWeight: 30,
    },
    {
      type: 'BARRIQUE',
      name: 'Barrique/Fût',
      description: 'Barrique ou fût de grande taille',
      basePrice: 120.0,
      pickupFee: 25.0,
      perKgPrice: 2.0,
      minWeight: 30,
      maxWeight: 100,
    },
    {
      type: 'ELECTRONICS',
      name: 'Électronique',
      description: 'Appareils électroniques avec assurance',
      basePrice: 65.0,
      pickupFee: 20.0,
      perKgPrice: 3.0,
      minWeight: 0,
      maxWeight: 25,
    },
    {
      type: 'VEHICLE',
      name: 'Véhicule',
      description: 'Voiture ou moto',
      basePrice: 1500.0,
      pickupFee: 100.0,
      perKgPrice: 0,
      minWeight: 500,
      maxWeight: 2000,
    },
  ];

  for (const pricing of pricings) {
    await prisma.pricing.create({ data: pricing });
  }

  // 4. Création des conteneurs
  console.log('📦 Création des conteneurs...');
  const containers = [];
  
  for (let i = 0; i < 5; i++) {
    const departureDate = randomDate(new Date(2024, 11, 1), new Date(2025, 2, 1));
    const arrivalDate = new Date(departureDate.getTime() + (15 + randomInt(0, 10)) * 24 * 60 * 60 * 1000);
    
    const container = await prisma.container.create({
      data: {
        containerNumber: `CNT${new Date().getFullYear()}${String(i + 1).padStart(2, '0')}${String(randomInt(1, 999)).padStart(3, '0')}`,
        name: `Conteneur ${['Janvier', 'Février', 'Mars', 'Avril', 'Mai'][i]} 2025`,
        departureDate,
        arrivalDate,
        actualDeparture: i < 3 ? departureDate : null,
        actualArrival: i < 2 ? arrivalDate : null,
        status: randomElement(containerStatuses),
        capacity: 100,
        currentLoad: randomInt(0, 100),
        maxWeight: 25000.0,
        currentWeight: randomFloat(0, 25000),
        origin: 'France',
        destination: 'Burkina Faso',
        currentLocation: randomElement([
          'Entrepôt Paris',
          'Port de Marseille',
          'En mer - Méditerranée',
          'Port d\'Abidjan',
          'Frontière Côte d\'Ivoire/Burkina',
          'Entrepôt Ouagadougou'
        ]),
        transportCompany: randomElement(['TransAfrica Logistics', 'Sahel Express', 'Continental Shipping']),
        driverName: `${randomElement(africanFirstNames)} ${randomElement(africanLastNames)}`,
        driverPhone: `+22670${randomInt(100000, 999999)}`,
        plateNumber: `BF-${randomInt(1000, 9999)}-AA`,
        transportCost: randomFloat(8000, 15000),
        customsCost: randomFloat(2000, 5000),
        totalCost: randomFloat(10000, 20000),
      },
    });
    containers.push(container);
  }

  // 5. Création des colis
  console.log('📮 Création des colis...');
  const packages = [];
  
  for (let i = 0; i < 50; i++) {
    const client = randomElement(clients);
    const container = Math.random() > 0.3 ? randomElement(containers) : null;
    const packageType = randomElement(packageTypes);
    const weight = randomFloat(1, 50);
    const basePrice = randomFloat(30, 200);
    const pickupFee = Math.random() > 0.5 ? randomFloat(10, 30) : 0;
    const insuranceFee = Math.random() > 0.7 ? randomFloat(5, 20) : 0;
    const customsFee = randomFloat(5, 25);
    const totalAmount = basePrice + pickupFee + insuranceFee + customsFee;
    
    const createdAt = randomDate(new Date(2024, 0, 1), new Date());
    const estimatedDelivery = new Date(createdAt.getTime() + (20 + randomInt(0, 30)) * 24 * 60 * 60 * 1000);
    
    const packageData = await prisma.package.create({
      data: {
        packageNumber: `PKG${new Date().getFullYear()}${String(i + 1).padStart(5, '0')}`,
        clientId: client.id,
        containerId: container?.id,
        userId: adminUser.id,
        type: packageType,
        description: randomElement([
          'Vêtements et chaussures',
          'Produits de beauté et cosmétiques',
          'Médicaments et produits de santé',
          'Matériel informatique',
          'Téléphones et accessoires',
          'Denrées alimentaires',
          'Documents officiels',
          'Cadeaux divers',
          'Matériel scolaire',
          'Articles ménagers'
        ]),
        quantity: randomInt(1, 5),
        weight,
        dimensions: `${randomInt(20, 80)}x${randomInt(20, 60)}x${randomInt(10, 40)} cm`,
        value: randomFloat(50, 1000),
        status: randomElement(packageStatuses),
        priority: randomElement(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
        isFragile: Math.random() > 0.8,
        isInsured: Math.random() > 0.7,
        pickupAddress: Math.random() > 0.5 ? `${randomInt(1, 999)} rue ${randomElement(['des Lilas', 'du Marché', 'de la Gare'])} ${client.city}` : null,
        pickupDate: Math.random() > 0.5 ? randomDate(createdAt, new Date()) : null,
        pickupTime: Math.random() > 0.5 ? randomElement(['9h-12h', '14h-17h', '18h-20h']) : null,
        deliveryAddress: client.recipientAddress,
        deliveryDate: Math.random() > 0.6 ? randomDate(new Date(), estimatedDelivery) : null,
        basePrice,
        pickupFee,
        insuranceFee,
        customsFee,
        totalAmount,
        paymentStatus: randomElement(['PENDING', 'PARTIAL', 'PAID']),
        paymentMethod: Math.random() > 0.3 ? randomElement(paymentMethods) : null,
        paidAmount: Math.random() > 0.5 ? randomFloat(0, totalAmount) : 0,
        paidAt: Math.random() > 0.5 ? randomDate(createdAt, new Date()) : null,
        estimatedDelivery,
        specialInstructions: Math.random() > 0.7 ? randomElement([
          'Fragile - Manipuler avec précaution',
          'Livrer en main propre uniquement',
          'Appeler avant livraison',
          'Produits périssables - Livrer rapidement'
        ]) : null,
        createdAt,
        updatedAt: createdAt,
      },
    });
    packages.push(packageData);
  }

  // 6. Création des mises à jour de tracking
  console.log('🗺️ Création des mises à jour de tracking...');
  for (const container of containers) {
    const updateCount = randomInt(3, 8);
    for (let i = 0; i < updateCount; i++) {
      await prisma.trackingUpdate.create({
        data: {
          containerId: container.id,
          userId: adminUser.id,
          location: randomElement([
            'Entrepôt Paris - Départ prévu',
            'Port de Marseille - Chargement',
            'En mer - Navigation en cours',
            'Port d\'Abidjan - Arrivée',
            'Douanes ivoiriennes - Contrôle',
            'Route vers Burkina - Transport terrestre',
            'Frontière - Formalités douanières',
            'Ouagadougou - Arrivée à destination'
          ]),
          description: randomElement([
            'Conteneur préparé et scellé',
            'Chargement sur le navire en cours',
            'Navigation normale, conditions météo favorables',
            'Arrivée au port, début des formalités',
            'Inspection douanière terminée',
            'Transport terrestre initié',
            'Passage de frontière effectué',
            'Conteneur disponible pour livraison'
          ]),
          latitude: randomFloat(4.0, 49.0),
          longitude: randomFloat(-5.0, 2.0),
          isPublic: true,
          timestamp: randomDate(container.departureDate || new Date(2024, 11, 1), new Date()),
        },
      });
    }
  }

  // 7. Création des factures
  console.log('🧾 Création des factures...');
  for (let i = 0; i < 20; i++) {
    const client = randomElement(clients);
    const issueDate = randomDate(new Date(2024, 0, 1), new Date());
    const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const subtotal = randomFloat(100, 1000);
    const taxRate = 0.20;
    const taxAmount = subtotal * taxRate;
    const discount = Math.random() > 0.8 ? randomFloat(10, 50) : 0;
    const totalAmount = subtotal + taxAmount - discount;
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
        clientId: client.id,
        userId: adminUser.id,
        issueDate,
        dueDate,
        status: randomElement(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
        subtotal,
        taxRate,
        taxAmount,
        discount,
        totalAmount,
        paidAmount: Math.random() > 0.5 ? randomFloat(0, totalAmount) : 0,
        notes: Math.random() > 0.7 ? 'Facture pour expédition de colis vers le Burkina Faso' : null,
        terms: 'Paiement à 30 jours',
      },
    });

    // Ajout d'items à la facture
    const itemCount = randomInt(1, 4);
    for (let j = 0; j < itemCount; j++) {
      const quantity = randomInt(1, 3);
      const unitPrice = randomFloat(30, 150);
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          packageId: Math.random() > 0.5 ? randomElement(packages).id : null,
          description: randomElement([
            'Expédition colis standard',
            'Frais de ramassage',
            'Assurance transport',
            'Frais de douane'
          ]),
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
        },
      });
    }
  }

  // 8. Création des paiements
  console.log('💳 Création des paiements...');
  for (let i = 0; i < 30; i++) {
    const client = randomElement(clients);
    await prisma.payment.create({
      data: {
        paymentNumber: `PAY-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
        clientId: client.id,
        packageId: Math.random() > 0.5 ? randomElement(packages).id : null,
        amount: randomFloat(50, 500),
        method: randomElement(paymentMethods),
        status: randomElement(['PENDING', 'COMPLETED', 'FAILED']),
        reference: `REF${randomInt(100000, 999999)}`,
        transactionId: `TXN${randomInt(1000000, 9999999)}`,
        paidAt: randomDate(new Date(2024, 0, 1), new Date()),
      },
    });
  }

  // 9. Création des notifications
  console.log('🔔 Création des notifications...');
  for (const user of [adminUser, ...clientUsers]) {
    const notificationCount = randomInt(5, 15);
    for (let i = 0; i < notificationCount; i++) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: randomElement(['SMS', 'EMAIL', 'WHATSAPP', 'PUSH']),
          title: randomElement([
            'Colis expédié',
            'Paiement reçu',
            'Conteneur en transit',
            'Livraison programmée',
            'Facture générée'
          ]),
          message: randomElement([
            'Votre colis a été expédié et est en cours de transport.',
            'Nous avons bien reçu votre paiement.',
            'Le conteneur contenant votre colis est maintenant en transit.',
            'La livraison de votre colis est programmée pour demain.',
            'Une nouvelle facture a été générée pour vos expéditions.'
          ]),
          isRead: Math.random() > 0.3,
          readAt: Math.random() > 0.5 ? randomDate(new Date(2024, 0, 1), new Date()) : null,
          createdAt: randomDate(new Date(2024, 0, 1), new Date()),
        },
      });
    }
  }

  // 10. Création des messages WhatsApp
  console.log('📱 Création des messages WhatsApp...');
  for (let i = 0; i < 25; i++) {
    const client = randomElement(clients);
    await prisma.whatsAppMessage.create({
      data: {
        to: client.phone,
        message: randomElement([
          'Bonjour, votre colis est en préparation.',
          'Votre colis a été collecté et sera expédié prochainement.',
          'Votre colis est maintenant en transit vers le Burkina Faso.',
          'Votre colis est arrivé à destination et sera livré sous peu.',
          'Votre colis a été livré avec succès.'
        ]),
        messageType: 'text',
        status: randomElement(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED']),
        messageId: `msg_${randomInt(100000, 999999)}`,
        packageId: Math.random() > 0.5 ? randomElement(packages).id : null,
        clientId: client.id,
        sentAt: Math.random() > 0.3 ? randomDate(new Date(2024, 0, 1), new Date()) : null,
        deliveredAt: Math.random() > 0.5 ? randomDate(new Date(2024, 0, 1), new Date()) : null,
        readAt: Math.random() > 0.7 ? randomDate(new Date(2024, 0, 1), new Date()) : null,
        createdAt: randomDate(new Date(2024, 0, 1), new Date()),
      },
    });
  }

  // 11. Création des paramètres système
  console.log('⚙️ Création des paramètres système...');
  const settings = [
    { key: 'company_name', value: 'ExpressAfrik', description: 'Nom de l\'entreprise' },
    { key: 'company_address', value: '123 Rue de la République, 75001 Paris', description: 'Adresse de l\'entreprise' },
    { key: 'company_phone', value: '+33 1 23 45 67 89', description: 'Téléphone de l\'entreprise' },
    { key: 'company_email', value: 'contact@expressafrik.fr', description: 'Email de l\'entreprise' },
    { key: 'default_currency', value: 'EUR', description: 'Devise par défaut' },
    { key: 'tax_rate', value: '20', description: 'Taux de TVA en %', type: 'number' },
    { key: 'whatsapp_enabled', value: 'true', description: 'Activer WhatsApp', type: 'boolean' },
    { key: 'sms_enabled', value: 'true', description: 'Activer SMS', type: 'boolean' },
    { key: 'pickup_fee', value: '20', description: 'Frais de ramassage par défaut', type: 'number' },
    { key: 'insurance_rate', value: '2', description: 'Taux d\'assurance en %', type: 'number' },
  ];

  for (const setting of settings) {
    await prisma.setting.create({
      data: {
        ...setting,
        updatedBy: adminUser.id,
      },
    });
  }

  // 12. Création des logs d'audit
  console.log('📝 Création des logs d\'audit...');
  const auditActions = [
    'CREATE_PACKAGE', 'UPDATE_PACKAGE', 'DELETE_PACKAGE',
    'CREATE_CLIENT', 'UPDATE_CLIENT',
    'CREATE_CONTAINER', 'UPDATE_CONTAINER',
    'SEND_WHATSAPP', 'GENERATE_INVOICE', 'PROCESS_PAYMENT'
  ];

  for (let i = 0; i < 50; i++) {
    await prisma.auditLog.create({
      data: {
        userId: randomElement([adminUser.id, ...clientUsers.map(u => u.id)]),
        action: randomElement(auditActions),
        resource: randomElement(['package', 'client', 'container', 'invoice', 'payment']),
        resourceId: randomElement(packages).id,
        details: JSON.stringify({
          timestamp: new Date().toISOString(),
          changes: ['status', 'location', 'amount'],
        }),
        ipAddress: `192.168.1.${randomInt(1, 254)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: randomDate(new Date(2024, 0, 1), new Date()),
      },
    });
  }

  console.log('✅ Seeding terminé avec succès !');
  console.log(`📊 Données créées :`);
  console.log(`   - ${await prisma.user.count()} utilisateurs`);
  console.log(`   - ${await prisma.client.count()} clients`);
  console.log(`   - ${await prisma.container.count()} conteneurs`);
  console.log(`   - ${await prisma.package.count()} colis`);
  console.log(`   - ${await prisma.invoice.count()} factures`);
  console.log(`   - ${await prisma.payment.count()} paiements`);
  console.log(`   - ${await prisma.notification.count()} notifications`);
  console.log(`   - ${await prisma.whatsAppMessage.count()} messages WhatsApp`);
  console.log(`   - ${await prisma.trackingUpdate.count()} mises à jour de tracking`);
  console.log(`   - ${await prisma.auditLog.count()} logs d'audit`);
  console.log(`   - ${await prisma.setting.count()} paramètres système`);

  console.log('\n🔑 Comptes de test créés :');
  console.log('   Admin: admin@expeditions.fr / password123');
  console.log('   Clients: [email généré automatiquement] / password123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });