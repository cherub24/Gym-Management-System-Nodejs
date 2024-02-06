const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Member = require('./models/memberModel');
const MemberType = require('./models/memberTypeModel');
const PaymentPlan = require('./models/paymentPlanModel');
const GymMaterial = require('./models/gymMaterialModel');
const Staff = require('./models/staffModel');
const User = require('./models/User');

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();
//const { calculateIncome } = require('./helpers/incomeCalculator'); // Create a separate file for the helper function


const app = express();
const port = 3002;


const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });



app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

//catch error
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});


const authRoutes = require('./routes/auth');
app.use('/', authRoutes);
///////////////////////////////////////////////////////////////////
// Import the dashboard route
const dashboardRoutes = require('./routes/dashboardRoutes');

// Use the dashboard route
app.use('/', dashboardRoutes);

/////////////////////////////////////////////////////////////////////
// Include the logoutRoutes
const logoutRoutes = require('./routes/logoutRoutes');
app.use('/', logoutRoutes);

//////////////////////////////////////////////////////////////////////////
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
const resetPasswordRoutes = require('./routes/resetPasswordRoutes');


// Use the forgotPasswordRoutes
app.use(forgotPasswordRoutes);

// Use the resetPasswordRoutes
app.use(resetPasswordRoutes);


// Include the forgotPasswordRoutes
//const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
//app.use('/', forgotPasswordRoutes);



/////////////////////////////////////////////////////////////////////////////
// Include the resetPasswordRoutes
//const resetPasswordRoutes = require('./routes/resetPasswordRoutes');
//app.use('/', resetPasswordRoutes);

////////////////////////////////////////////////////////////////////////////
app.get('/', (req, res) => {
    res.render('login');
});




// Route to display the form for adding a new member type
app.get('/member-types/new', (req, res) => {
    res.render('newMemberType');
});

// Route to handle the creation of a new member type
app.post('/member-types', async (req, res) => {
    try {
        const newMemberType = await MemberType.create({
            name: req.body.name,
            amount: req.body.amount,
        });

        console.log('New member type created:', newMemberType);
        res.redirect('/member-types');
    } catch (error) {
        console.error('Error creating member type:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// Route to display the list of member types
app.get('/member-types', async (req, res) => {
    try {
        const memberTypes = await MemberType.find();
        res.render('memberTypes', { memberTypes });
    } catch (error) {
        console.error('Error fetching member types:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to display the form for editing a member type
app.get('/member-types/edit/:id', async (req, res) => {
    try {
        const memberType = await MemberType.findById(req.params.id);
        res.render('editMemberType', { memberType });
    } catch (error) {
        console.error('Error fetching member type for editing:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle the editing of a member type
app.post('/member-types/edit/:id', async (req, res) => {
    try {
        await MemberType.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            amount: req.body.amount,
        });

        console.log('Member type updated successfully');
        res.redirect('/member-types');
    } catch (error) {
        console.error('Error updating member type:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// Route to handle the deletion of a member type
app.post('/member-types/delete/:id', async (req, res) => {
    try {
        await MemberType.findByIdAndDelete(req.params.id);
        console.log('Member type deleted successfully');
        res.redirect('/member-types');
    } catch (error) {
        console.error('Error deleting member type:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////


// Route to display the list of members

// Route to display the list of members
app.get('/members', async (req, res) => {
    try {
        const members = await Member.find().populate('type').populate('paymentPlan');
        res.render('members', { members });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to handle the creation of a new member
app.post('/members', async (req, res) => {
    try {
        const newMember = await Member.create({
            name: req.body.name,
            type: req.body.type,
            paymentPlan: req.body.paymentPlan, // Add this line to capture the selected payment plan
            // Add other member fields as needed
        });

        console.log('New member created:', newMember);

        // Update last payment date to the current date
        newMember.lastPaymentDate = new Date();
        await newMember.save();

        // Redirect to the members list page after successful creation
        res.redirect('/members');
    } catch (error) {
        console.error('Error creating member:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to display the form for adding a new member
app.get('/members/new', async (req, res) => {
    try {
        const memberTypes = await MemberType.find();
        const paymentPlans = await PaymentPlan.find();
        res.render('newMember', { memberTypes, paymentPlans });
    } catch (error) {
        console.error('Error fetching member types or payment plans:', error);
        res.status(500).render('error', { error });
    }
});


// Route to handle the creation of a new member
app.post('/members/new', async (req, res) => {
    console.log('Received form data:', req.body);

    try {
        const memberTypes = await MemberType.find();
        const paymentPlans = await PaymentPlan.find();

        const paymentPlan = await PaymentPlan.findById(req.body.paymentPlan);
        if (!paymentPlan) {
            return res.status(404).send('Payment plan not found');
        }

        const expirationDate = calculateExpirationDate(new Date(), paymentPlan.duration);

        const newMember = await Member.create({
            name: req.body.name,
            type: req.body.type,
            paymentPlan: req.body.paymentPlan,
            lastPaymentDateTime: new Date(),
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            photo: req.body.photo,
            expirationDate: expirationDate,
        });

        console.log('New member created:', newMember);

        res.redirect('/members');
    } catch (error) {
        console.error('Error creating member:', error);
        res.status(500).render('newMember', { memberTypes: [], paymentPlans: [], error });
    }
});



// Route to render the edit member form
app.get('/members/edit/:id', async (req, res) => {
    try {
        const memberId = req.params.id;
        const member = await Member.findById(memberId).populate('type').populate('paymentPlan');
        const memberTypes = await MemberType.find();
        const paymentPlans = await PaymentPlan.find();

        res.render('editMember', { member, memberTypes, paymentPlans });
    } catch (error) {
        console.error('Error fetching member for edit:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to handle the submission of the edited member
app.post('/members/edit/:id', async (req, res) => {
    try {
        const memberId = req.params.id;
        const updatedMember = await Member.findByIdAndUpdate(memberId, {
            name: req.body.name,
            type: req.body.type,
            paymentPlan: req.body.paymentPlan,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            photo: req.body.photo,
            // Update other fields as needed
        }, { new: true });

        if (!updatedMember) {
            return res.status(404).send('Member not found');
        }

        console.log('Member updated successfully:', updatedMember);
        res.redirect('/members'); // Redirect to the member list or another appropriate page
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to delete a member
// Assuming you have a route for rendering the delete confirmation page
app.get('/members/delete/:id', async (req, res) => {
    try {
        const memberId = req.params.id;
        const member = await Member.findById(memberId);

        if (!member) {
            return res.status(404).send('Member not found');
        }

        // Render the delete confirmation page with member data
        res.render('deleteMember', { member });
    } catch (error) {
        console.error('Error fetching member for delete confirmation:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle the deletion of the member
app.post('/members/delete/:id', async (req, res) => {
    try {
        const memberId = req.params.id;
        const deletedMember = await Member.findByIdAndDelete(memberId);

        if (!deletedMember) {
            return res.status(404).send('Member not found');
        }

        console.log('Member deleted successfully:', deletedMember);
        res.redirect('/members'); // Redirect to the member list or another appropriate page
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle member search
app.get('/members/search', async (req, res) => {
    try {
        const query = req.query.q; // Get the search query from the URL parameter 'q'
        const members = await Member.find({
            $or: [
                { name: { $regex: new RegExp(query, 'i') } }, // Case-insensitive name search
                { phoneNumber: { $regex: new RegExp(query, 'i') } } // Case-insensitive phone number search
            ]
        }).populate('type').populate('paymentPlan');

        res.render('members', { members });
    } catch (error) {
        console.error('Error searching members:', error);
        res.status(500).send('Internal Server Error');
    }
});




// // Route to display Eurobics Members
const eurobicsTypeId = '65b8c8d99ceadc23f2a6c2f7'; //  ID
app.get('/members/eurobics', async (req, res) => {
    console.log('Reached Eurobics Members route');
    try {
        const eurobicsMembers = await Member.find({ type: eurobicsTypeId });
        console.log('Eurobics Members:', eurobicsMembers);
        res.render('eurobicsMembers', { members: eurobicsMembers });
    } catch (error) {
        console.error('Error fetching Eurobics Members:', error);
        res.status(500).send('Internal Server Error');
    }
});

// // Route to display Tekwando Members
const tekwandoTypeId = '65b94184ce653e3c5fe5c9dc'; // type id
app.get('/members/tekwando', async (req, res) => {
    console.log('Reached Tekwando Members route');
    try {
        const tekwandoMembers = await Member.find({ type: tekwandoTypeId });
        console.log('Tekwando Members:', tekwandoMembers);
        res.render('tekwandoMembers', { members: tekwandoMembers });
    } catch (error) {
        console.error('Error fetching Tekwando Members:', error);
        res.status(500).send('Internal Server Error');
    }
});




// // Route to display weightlift Members
const weightliftTypeId = '65b941c1ce653e3c5fe5c9df'; // type id
app.get('/members/weightlift', async (req, res) => {
    console.log('Reached weightlift Members route');
    try {
        const weightliftMembers = await Member.find({ type: weightliftTypeId });
        console.log('Weightlift Members:', weightliftMembers);
        res.render('weightliftMembers', { members: weightliftMembers });
    } catch (error) {
        console.error('Error fetching weightlift Members:', error);
        res.status(500).send('Internal Server Error');
    }
});


// // Route to display Personaltrain Members
const personaltrainTypeId = '65b941d4ce653e3c5fe5c9e2'; // type id
app.get('/members/personaltrain', async (req, res) => {
    console.log('Reached Personaltrain Members route');
    try {
        const personaltrainMembers = await Member.find({ type: personaltrainTypeId });
        console.log('Personaltrain Members:', personaltrainMembers);
        res.render('personaltrainMembers', { members: personaltrainMembers });
    } catch (error) {
        console.error('Error fetching personaltrain Members:', error);
        res.status(500).send('Internal Server Error');
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////

// Route to display the form for adding a new payment plan
app.get('/payment-plans/new', async (req, res) => {
    try {
        const memberTypes = await MemberType.find();
        res.render('newPaymentPlan', { memberTypes }); // Pass memberTypes to the view
    } catch (error) {
        console.error('Error fetching member types:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to display the list of payment plans
app.get('/payment-plans', async (req, res) => {
    try {
        const paymentPlans = await PaymentPlan.find().populate('memberType');
        res.render('paymentPlans', { paymentPlans });
    } catch (error) {
        console.error('Error fetching payment plans:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Route to handle the creation of a new payment plan
app.post('/payment-plans', async (req, res) => {
    try {
        const selectedMemberType = await MemberType.findById(req.body.memberType);
        if (!selectedMemberType) {
            return res.status(404).send('Member type not found');
        }

        const newPaymentPlan = await PaymentPlan.create({
            name: req.body.name,
            duration: req.body.duration,
            amount: selectedMemberType.amount * req.body.duration,
            memberType: selectedMemberType._id,
            // Add other payment plan fields as needed
        });

        console.log('New payment plan created:', newPaymentPlan);
        res.redirect('/');
    } catch (error) {
        console.error('Error creating payment plan:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Route to handle the submission of the edited payment plan
app.post('/payment-plans/edit/:id', async (req, res) => {
    try {
        const paymentPlanId = req.params.id;

        // Update the payment plan fields based on the form data
        const updatedPaymentPlan = await PaymentPlan.findByIdAndUpdate(paymentPlanId, {
            name: req.body.name,
            duration: req.body.duration,
            memberType: req.body.memberType,
            // Add other payment plan fields as needed
        }, { new: true });

        if (!updatedPaymentPlan) {
            return res.status(404).send('Payment plan not found');
        }

        console.log('Payment plan updated successfully:', updatedPaymentPlan);
        res.redirect('/payment-plans'); // Redirect to the payment plans list or another appropriate page
    } catch (error) {
        console.error('Error updating payment plan:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Route to handle the deletion of a payment plan
app.get('/payment-plans/delete/:id', async (req, res) => {
    try {
        const deletedPaymentPlan = await PaymentPlan.findByIdAndDelete(req.params.id);

        if (!deletedPaymentPlan) {
            return res.status(404).send('Payment plan not found');
        }

        console.log('Payment plan deleted successfully:', deletedPaymentPlan);
        res.redirect('/payment-plans'); // Redirect to the payment plan list or another appropriate page
    } catch (error) {
        console.error('Error deleting payment plan:', error);
        res.status(500).send('Internal Server Error');
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Route to fetch the number of paid members
// Route to display paid members report
app.get('/report/paid-members', async (req, res) => {
    try {
        const currentDate = new Date();
        const members = await Member.find().populate(['type', 'paymentPlan']);

        const paidMembers = members.filter(member => {
            return member.lastPaymentDateTime && member.lastPaymentDateTime >= currentDate;
        });

        const paidMembersCount = paidMembers.length;

        res.render('reportPaidMembers', { paidMembers, paidMembersCount });
    } catch (error) {
        console.error('Error fetching paid members:', error);
        res.status(500).render('error', { error });
    }
});





// Route to get the number of unpaid members
app.get('/report/number-of-unpaid-members', async (req, res) => {
    try {
        const numberOfUnpaidMembers = await Member.countDocuments({ lastPaymentDateTime: { $lt: new Date() } });
        res.json({ numberOfUnpaidMembers });
    } catch (error) {
        console.error('Error fetching number of unpaid members:', error);
       res.status(500).json({ error: 'Internal Server Error' });
    }
});




// Route to get the list of unpaid members
// Route to get the list of unpaid members
//app.get('/report/unpaid-members', async (req, res) => {
    //try {
        //const unpaidMembers = await Member.find({ lastPaymentDateTime: { $lt: new Date() }, isPaid: false })
          //  .populate('type')
        //    .lean(); // Convert Mongoose document to plain JavaScript object

      //  res.json(unpaidMembers);
    //} catch (error) {
      //  console.error('Error fetching unpaid members:', error);
    //    res.status(500).json({ error: 'Internal Server Error' });
  //  }
//});
// Route to display unpaid members report
// Route to display unpaid members report
app.get('/report/unpaid-members', async (req, res) => {
    try {
        const currentDate = new Date();

        // Fetch unpaid members with proper population
        const unpaidMembers = await Member.find({
            lastPaymentDateTime: { $lt: currentDate },
            isPaid: false,
        }).populate(['type', 'paymentPlan']);

        const unpaidMembersCount = unpaidMembers.length;

        res.render('reportUnpaidMembers', { unpaidMembers, unpaidMembersCount, currentDate });
    } catch (error) {
        console.error('Error fetching unpaid members:', error);
        res.status(500).render('error', { error });
    }
});










// Route to mark a member as paid
app.post('/members/mark-as-paid/:id', async (req, res) => {
    const memberId = req.params.id;

    try {
        const member = await Member.findById(memberId).populate('paymentPlan');
        if (!member) {
            return res.status(404).send('Member not found');
        }

        // Set the lastPaymentDateTime to the expiration date of the payment plan
        member.lastPaymentDateTime = calculateExpirationDate(new Date(), member.paymentPlan.duration);
        await member.save();

        res.redirect('/members');
    } catch (error) {
        console.error('Error marking member as paid:', error);
        res.status(500).render('error', { error });
    }
});

// Function to calculate the expiration date based on the current date and payment plan duration
//function calculateExpirationDate(startDate, durationInMonths) {
  //  const expirationDate = new Date(startDate);
    //expirationDate.setMonth(expirationDate.getMonth() + durationInMonths);
    //return expirationDate;
//}



// Synchronous function to wrap your asynchronous code

// Function to calculate the income for a given member
function calculateMemberIncome(member, currentDate) {
    let totalIncome = 0;

    if (member.lastPaymentDateTime) {
        const lastPaymentDate = new Date(member.lastPaymentDateTime);

        if (lastPaymentDate <= currentDate) {
            // Member has made a payment, add the payment plan amount to total income
            totalIncome += member.paymentPlan ? (member.paymentPlan.amount || 0) : 0;
        }
    }

    return totalIncome;
}

// Function to calculate the total income for all members
function calculateTotalIncome(members, currentDate) {
    return members.reduce((totalIncome, member) => {
        const memberIncome = calculateMemberIncome(member, currentDate);
        return totalIncome + memberIncome;
    }, 0);
}

// Automated task to calculate member movements and income
async function automateMemberMovements() {
    try {
        const currentDate = new Date();
        const members = await Member.find().populate(['type', 'paymentPlan']);

        // Your income calculation logic goes here...
        const totalMonthlyIncome = calculateTotalIncome(members, currentDate);

        console.log('Automated task completed. Total Monthly Income:', totalMonthlyIncome);
    } catch (error) {
        console.error('Error automating member movements:', error);
    }
}

// Call the function initially
automateMemberMovements();

// Set interval to call the function every 24 hours
setInterval(automateMemberMovements, 24 * 60 * 60 * 1000);



// Route to get the count of all members
// this route to fetch the number of members
app.get('/report/number-of-members', async (req, res) => {
    try {
        const numberOfMembers = await Member.countDocuments();
        res.json({ numberOfMembers });
    } catch (error) {
        console.error('Error fetching number of members:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Add this route to fetch the number of paid members
app.get('/report/number-of-paid-members', async (req, res) => {
    try {
        const numberOfPaidMembers = await Member.countDocuments({ lastPaymentDateTime: { $gte: new Date() } });
        res.json({ numberOfPaidMembers });
    } catch (error) {
        console.error('Error fetching number of paid members:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





// Route to display monthly income report
app.get('/report/monthly-income', async (req, res) => {
    try {
        const currentDate = new Date();
        const members = await Member.find().populate(['type', 'paymentPlan']);

        // Remove members with expiration date in the past
        const validMembers = members.filter(member => !member.expirationDate || member.expirationDate >= currentDate);

        const incomeData = calculateIncome(validMembers, 'month', currentDate);

        console.log('Monthly Income:', incomeData.totalIncome); // Log the total monthly income
        console.log('Current Date:', currentDate); // Log the currentDate value

        // Check if incomeData.members is defined before rendering the template
        if (incomeData && incomeData.members) {
            res.render('reportMonthlyIncome', { incomeData, currentDate });
        } else {
            // Handle the case where incomeData.members is undefined or empty
            res.status(500).render('error', { error: 'Invalid income data' });
        }
    } catch (error) {
        console.error('Error fetching total monthly income:', error);
        res.status(500).render('error', { error });
    }
});






// Calculate income function to use expirationDate
function calculateIncome(members, duration, currentDate) {
    const validMembers = members.filter(member => {
        if (member.expirationDate) {
            const expirationDate = new Date(member.expirationDate);
            return duration === 'month' ? expirationDate >= currentDate : expirationDate.getFullYear() === currentDate.getFullYear();
        }
        return false;
    });

    const totalIncome = validMembers.reduce((total, member) => {
        return total + (member.paymentPlan ? (member.paymentPlan.amount || 0) : 0);
    }, 0);

    return { members: validMembers, totalIncome };
}



// Route to display the form for adding gym materials
app.get('/gym-materials/new', (req, res) => {
    res.render('newGymMaterial');
});

// Route to display the list of gym materials
app.get('/gym-materials', async (req, res) => {
    try {
        const gymMaterials = await GymMaterial.find();
        res.render('gymMaterials', { gymMaterials }); // Update this line to use the correct view file name
    } catch (error) {
        console.error('Error fetching gym materials:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to handle the creation of a new gym material
app.post('/gym-materials', async (req, res) => {
    try {
        const newGymMaterial = await GymMaterial.create({
            name: req.body.name,
            image: req.body.image, // You need to handle file uploads here
            price: req.body.price,
            quantity: req.body.quantity,
            equipmentType: req.body.equipmentType,
        });

        console.log('New gym material created:', newGymMaterial);
        res.redirect('/gym-materials');
    } catch (error) {
        console.error('Error creating gym material:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to display the list of gym materials
app.get('/gym-materials', async (req, res) => {
    try {
        const gymMaterials = await GymMaterial.find();
        res.render('gymMaterials', { gymMaterials });
    } catch (error) {
        console.error('Error fetching gym materials:', error);
        res.status(500).send('Internal Server Error');
    }
});



// counter for gym material
// Route to display gym material counters
app.get('/gym-material-counters', async (req, res) => {
    try {
        const materials = await GymMaterial.find();
        
        // Calculate material count
        const materialCount = materials.length;

        // Calculate total cost by multiplying price by quantity for each material
        const totalCost = materials.reduce((total, material) => {
            // Multiply the price by the quantity of each material and add to the total
            const materialCost = (material.price || 0) * (material.quantity || 0);
            return total + materialCost;
        }, 0);

        res.render('gymMaterialCounters', { materialCount, totalCost });
    } catch (error) {
        console.error('Error fetching gym materials:', error);
        res.status(500).render('error', { error });
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Route to display the form for adding gym staff
app.get('/gym-staff/new', (req, res) => {
    res.render('newGymStaff');
});

// Route to handle the creation of a new staff member
app.post('/gym-staff', async (req, res) => {
    try {
        const newStaffMember = await Staff.create({
            name: req.body.name,
            position: req.body.position,
            salary: req.body.salary,
        });

        console.log('New staff member created:', newStaffMember);
        res.redirect('/gym-staff');
    } catch (error) {
        console.error('Error creating staff member:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to display the list of gym staff
app.get('/gym-staff', async (req, res) => {
    try {
        const gymStaff = await Staff.find();
        res.render('gymStaff', { gymStaff });
    } catch (error) {
        console.error('Error fetching gym staff:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to display gym staff counters
app.get('/gym-staff-counters', async (req, res) => {
    try {
        const staffMembers = await Staff.find();
        
        // Calculate staff count
        const staffCount = staffMembers.length;

        // Calculate total payroll
        const totalPayroll = staffMembers.reduce((total, staff) => {
            // Add the salary of each staff member to the total
            const staffSalary = staff.salary || 0;
            return total + staffSalary;
        }, 0);

        res.render('gymStaffCounters', { staffCount, totalPayroll });
    } catch (error) {
        console.error('Error fetching gym staff:', error);
        res.status(500).render('error', { error });
    }
});


// Route to display the form for editing a gym staff member
app.get('/gym-staff/edit/:id', async (req, res) => {
    try {
        const staffId = req.params.id;
        const staffMember = await Staff.findById(staffId);
        res.render('editGymStaff', { staffMember });
    } catch (error) {
        console.error('Error fetching gym staff member:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle the submission of the edited gym staff member
app.post('/gym-staff/edit/:id', async (req, res) => {
    try {
        const staffId = req.params.id;
        const updatedStaffMember = await Staff.findByIdAndUpdate(staffId, {
            name: req.body.name,
            position: req.body.position,
            salary: req.body.salary,
            // Add other fields as needed
        }, { new: true });

        if (!updatedStaffMember) {
            return res.status(404).send('Gym staff member not found');
        }

        console.log('Gym staff member updated successfully:', updatedStaffMember);
        res.redirect('/gym-staff'); // Redirect to the gym staff list or another appropriate page
    } catch (error) {
        console.error('Error updating gym staff member:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle the deletion of a gym staff member
app.get('/gym-staff/delete/:id', async (req, res) => {
    try {
        const staffId = req.params.id;
        const deletedStaffMember = await Staff.findByIdAndDelete(staffId);

        if (!deletedStaffMember) {
            return res.status(404).send('Gym staff member not found');
        }

        console.log('Gym staff member deleted successfully:', deletedStaffMember);
        res.redirect('/gym-staff'); // Redirect to the gym staff list or another appropriate page
    } catch (error) {
        console.error('Error deleting gym staff member:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


//
// Function to calculate the expiration date based on the current date and payment plan duration
function calculateExpirationDate(startDate, durationInMonths) {
    const expirationDate = new Date(startDate);
    expirationDate.setMonth(expirationDate.getMonth() + durationInMonths);
    return expirationDate;
}
