// Veg Menu Items
const vegMenu = {
    starters: ['Paneer Tikka', 'Veg Spring Rolls', 'Hara Bhara Kabab', 'Veg Manchurian', 'Crispy Corn'],
    mainCourse: ['Paneer Butter Masala', 'Dal Makhani', 'Veg Biryani', 'Shahi Paneer', 'Mix Veg', 'Kadai Paneer'],
    breads: ['Butter Naan', 'Garlic Naan', 'Tandoori Roti', 'Stuffed Kulcha'],
    rice: ['Jeera Rice', 'Ghee Rice', 'Veg Pulao', 'Lemon Rice'],
    desserts: ['Gulab Jamun', 'Rasmalai', 'Ice Cream', 'Fruit Salad', 'Gajar Ka Halwa']
};

// Non-Veg Menu Items
const nonVegMenu = {
    starters: ['Chicken Tikka', 'Fish Fry', 'Mutton Seekh Kabab', 'Chicken Lollipop', 'Prawn Tempura'],
    mainCourse: ['Butter Chicken', 'Chicken Curry', 'Mutton Rogan Josh', 'Fish Curry', 'Egg Curry', 'Chicken Biryani'],
    breads: ['Butter Naan', 'Garlic Naan', 'Tandoori Roti', 'Roomali Roti'],
    rice: ['Chicken Biryani', 'Mutton Biryani', 'Ghee Rice', 'Jeera Rice'],
    desserts: ['Gulab Jamun', 'Rasmalai', 'Ice Cream', 'Fruit Salad', 'Double Ka Meetha']
};

// Pricing per person (in INR)
const pricing = {
    veg: {
        100: 350,
        150: 320,
        200: 300,
        300: 280
    },
    nonVeg: {
        100: 450,
        150: 420,
        200: 400,
        300: 380
    }
};

// Team Package Pricing
const teamPackages = {
    cooking: {
        basic: { price: 15000, description: '2 Chefs + 2 Helpers for 4 hours' },
        premium: { price: 25000, description: '3 Chefs + 4 Helpers for 6 hours' },
        luxury: { price: 40000, description: '5 Chefs + 6 Helpers + Head Chef for 8 hours' }
    },
    serving: {
        basic: { price: 8000, description: '4 Servers for 4 hours' },
        premium: { price: 12000, description: '6 Servers for 6 hours' },
        luxury: { price: 18000, description: '10 Servers for 8 hours' }
    },
    dishwasher: {
        basic: { price: 5000, description: '2 Staff + Equipment for 4 hours' },
        premium: { price: 8000, description: '3 Staff + Equipment for 6 hours' },
        luxury: { price: 12000, description: '5 Staff + Equipment for 8 hours' }
    }
};

let currentService = null;
let selectedGuests = null;
let selectedFoodType = null;
let selectedPackage = null;

// Show Service Detail Modal
function showServiceDetail(service) {
    currentService = service;
    const modal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (service === 'cooking') {
        modalTitle.innerHTML = 'Food Cooking Team Booking';
        modalBody.innerHTML = getCookingTeamHTML();
    } else if (service === 'serving') {
        modalTitle.innerHTML = 'Food Serving Team Booking';
        modalBody.innerHTML = getServingTeamHTML();
    } else if (service === 'dishwasher') {
        modalTitle.innerHTML = 'Dishwasher Service Booking';
        modalBody.innerHTML = getDishwasherHTML();
    } else {
        modalTitle.innerHTML = getServiceTitle(service);
        modalBody.innerHTML = getServiceHTML(service);
    }
    
    modal.style.display = 'block';
    
    // Add event listeners after DOM is loaded
    if (service === 'cooking' || service === 'serving' || service === 'dishwasher') {
        attachTeamEventListeners();
    } else {
        attachEventListeners();
    }
}

function getServiceTitle(service) {
    const titles = {
        'dishes': 'Wedding & Parties Dishes',
        'tent': 'Tent Equipment Rental',
        'decoration': 'Decoration Services',
        'cardecor': 'Car Decoration Services'
    };
    return titles[service] || 'Service Details';
}

function getServiceHTML(service) {
    if (service === 'dishes') {
        return `
            <div class="service-description">
                <h3>Extensive Menu for All Occasions</h3>
                <p>Choose from our wide range of vegetarian and non-vegetarian dishes</p>
                
                <div class="guest-selection">
                    <h4>Select Estimated Guests Count:</h4>
                    <div class="guest-options">
                        <button class="guest-btn" data-guests="100">100 Guests</button>
                        <button class="guest-btn" data-guests="150">150 Guests</button>
                        <button class="guest-btn" data-guests="200">200 Guests</button>
                        <button class="guest-btn" data-guests="300">300 Guests</button>
                    </div>
                </div>
                
                <div class="food-selection">
                    <h4>Select Food Type:</h4>
                    <div class="food-type">
                        <button class="food-btn" data-food="veg">Vegetarian</button>
                        <button class="food-btn" data-food="nonveg">Non-Vegetarian</button>
                    </div>
                </div>
                
                <div id="menuDisplay" style="display:none;">
                    <div class="menu-items">
                        <h4>Selected Menu:</h4>
                        <div id="menuList"></div>
                    </div>
                    <div class="cost-display">
                        <h3>Estimated Cost: ₹<span id="estimatedCost">0</span></h3>
                    </div>
                    <div class="package-options">
                        <h4>Choose Package:</h4>
                        <button class="package-btn" data-package="full">Full Package (Food + Setup)</button>
                        <button class="package-btn" data-package="booking">Only Booking Team</button>
                    </div>
                    <button class="book-btn" onclick="proceedToBooking()">Book Now</button>
                </div>
            </div>
        `;
    } else if (service === 'tent') {
        return `
            <div class="service-description">
                <h3>Tent & Equipment Rental</h3>
                <p>Premium tents, furniture, and equipment for your events</p>
                
                <div class="equipment-list">
                    <h4>Available Packages:</h4>
                    <div class="package-options">
                        <button class="package-btn" data-package="basic">Basic Package - ₹25,000</button>
                        <button class="package-btn" data-package="premium">Premium Package - ₹45,000</button>
                        <button class="package-btn" data-package="luxury">Luxury Package - ₹75,000</button>
                    </div>
                </div>
                
                <div id="packageDetails"></div>
                <button class="book-btn" onclick="proceedToBooking()">Book Now</button>
            </div>
        `;
    } else if (service === 'decoration') {
        return `
            <div class="service-description">
                <h3>Wedding Decoration Services</h3>
                <p>Beautiful decorations for your special day</p>
                
                <div class="decoration-options">
                    <h4>Choose Decoration Theme:</h4>
                    <div class="package-options">
                        <button class="package-btn" data-package="traditional">Traditional - ₹35,000</button>
                        <button class="package-btn" data-package="modern">Modern - ₹40,000</button>
                        <button class="package-btn" data-package="royal">Royal - ₹60,000</button>
                        <button class="package-btn" data-package="floral">Floral - ₹50,000</button>
                    </div>
                </div>
                <button class="book-btn" onclick="proceedToBooking()">Book Now</button>
            </div>
        `;
    } else if (service === 'cardecor') {
        return `
            <div class="service-description">
                <h3>Barat Car Decoration</h3>
                <p>Elegant car decoration for wedding procession</p>
                
                <div class="car-decor-options">
                    <h4>Choose Decoration Style:</h4>
                    <div class="package-options">
                        <button class="package-btn" data-package="simple">Simple - ₹5,000</button>
                        <button class="package-btn" data-package="premium">Premium - ₹10,000</button>
                        <button class="package-btn" data-package="luxury">Luxury - ₹15,000</button>
                        <button class="package-btn" data-package="royal">Royal - ₹25,000</button>
                    </div>
                </div>
                <button class="book-btn" onclick="proceedToBooking()">Book Now</button>
            </div>
        `;
    }
    return '<p>Service details coming soon...</p>';
}

function getCookingTeamHTML() {
    return `
        <div class="service-description">
            <h3>Professional Cooking Team</h3>
            <p>Expert chefs to handle your event's cooking needs</p>
            
            <div class="team-packages">
                <h4>Choose Team Package:</h4>
                <div class="package-options">
                    <button class="package-btn" data-team="basic">Basic - ₹15,000</button>
                    <button class="package-btn" data-team="premium">Premium - ₹25,000</button>
                    <button class="package-btn" data-team="luxury">Luxury - ₹40,000</button>
                </div>
            </div>
            
            <div id="teamDetails" class="team-details"></div>
            <button class="book-btn" onclick="proceedToBooking()">Book Cooking Team</button>
        </div>
    `;
}

function getServingTeamHTML() {
    return `
        <div class="service-description">
            <h3>Professional Serving Team</h3>
            <p>Experienced serving staff for your event</p>
            
            <div class="team-packages">
                <h4>Choose Serving Package:</h4>
                <div class="package-options">
                    <button class="package-btn" data-team="basic">Basic - ₹8,000</button>
                    <button class="package-btn" data-team="premium">Premium - ₹12,000</button>
                    <button class="package-btn" data-team="luxury">Luxury - ₹18,000</button>
                </div>
            </div>
            
            <div id="teamDetails" class="team-details"></div>
            <button class="book-btn" onclick="proceedToBooking()">Book Serving Team</button>
        </div>
    `;
}

function getDishwasherHTML() {
    return `
        <div class="service-description">
            <h3>Dishwasher Service</h3>
            <p>Complete dishwashing and cleanup service</p>
            
            <div class="team-packages">
                <h4>Choose Package:</h4>
                <div class="package-options">
                    <button class="package-btn" data-team="basic">Basic - ₹5,000</button>
                    <button class="package-btn" data-team="premium">Premium - ₹8,000</button>
                    <button class="package-btn" data-team="luxury">Luxury - ₹12,000</button>
                </div>
            </div>
            
            <div id="teamDetails" class="team-details"></div>
            <button class="book-btn" onclick="proceedToBooking()">Book Dishwasher Service</button>
        </div>
    `;
}

function attachEventListeners() {
    // Guest selection
    document.querySelectorAll('.guest-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.guest-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedGuests = parseInt(this.dataset.guests);
            updateCost();
        });
    });
    
    // Food type selection
    document.querySelectorAll('.food-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.food-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedFoodType = this.dataset.food;
            updateMenu();
            updateCost();
        });
    });
    
    // Package selection
    document.querySelectorAll('.package-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.package-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedPackage = this.dataset.package;
        });
    });
}

function attachTeamEventListeners() {
    document.querySelectorAll('.package-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.package-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const teamType = this.dataset.team;
            const teamDetails = document.getElementById('teamDetails');
            
            let details = '';
            if (currentService === 'cooking') {
                if (teamType === 'basic') details = '2 Chefs + 2 Helpers for 4 hours';
                else if (teamType === 'premium') details = '3 Chefs + 4 Helpers for 6 hours';
                else details = '5 Chefs + 6 Helpers + Head Chef for 8 hours';
            } else if (currentService === 'serving') {
                if (teamType === 'basic') details = '4 Servers for 4 hours';
                else if (teamType === 'premium') details = '6 Servers for 6 hours';
                else details = '10 Servers for 8 hours';
            } else if (currentService === 'dishwasher') {
                if (teamType === 'basic') details = '2 Staff + Equipment for 4 hours';
                else if (teamType === 'premium') details = '3 Staff + Equipment for 6 hours';
                else details = '5 Staff + Equipment for 8 hours';
            }
            
            teamDetails.innerHTML = `<div class="cost-display"><h3>Package Details: ${details}</h3></div>`;
        });
    });
}

function updateMenu() {
    const menuDisplay = document.getElementById('menuDisplay');
    const menuList = document.getElementById('menuList');
    
    if (selectedGuests && selectedFoodType) {
        menuDisplay.style.display = 'block';
        const menu = selectedFoodType === 'veg' ? vegMenu : nonVegMenu;
        
        let menuHTML = '<div class="menu-grid">';
        for (const [category, items] of Object.entries(menu)) {
            menuHTML += `<div><strong>${category.toUpperCase()}:</strong><br>`;
            items.forEach(item => {
                menuHTML += `<div class="menu-item">• ${item}</div>`;
            });
            menuHTML += '</div><br>';
        }
        menuHTML += '</div>';
        menuList.innerHTML = menuHTML;
    }
}

function updateCost() {
    if (selectedGuests && selectedFoodType) {
        const cost = pricing[selectedFoodType][selectedGuests] * selectedGuests;
        document.getElementById('estimatedCost').innerText = cost.toLocaleString('en-IN');
    }
}

function proceedToBooking() {
    let bookingData = {
        service: currentService,
        timestamp: new Date().toISOString()
    };
    
    if (currentService === 'cooking' || currentService === 'serving' || currentService === 'dishwasher') {
        const selectedTeamBtn = document.querySelector('.package-btn.active');
        if (selectedTeamBtn) {
            bookingData.teamPackage = selectedTeamBtn.dataset.team;
            let cost = 0;
            if (currentService === 'cooking') {
                cost = selectedTeamBtn.dataset.team === 'basic' ? 15000 : selectedTeamBtn.dataset.team === 'premium' ? 25000 : 40000;
            } else if (currentService === 'serving') {
                cost = selectedTeamBtn.dataset.team === 'basic' ? 8000 : selectedTeamBtn.dataset.team === 'premium' ? 12000 : 18000;
            } else {
                cost = selectedTeamBtn.dataset.team === 'basic' ? 5000 : selectedTeamBtn.dataset.team === 'premium' ? 8000 : 12000;
            }
            bookingData.cost = cost;
        } else {
            alert('Please select a package first');
            return;
        }
    } else {
        if (currentService === 'dishes') {
            if (!selectedGuests || !selectedFoodType) {
                alert('Please select guest count and food type');
                return;
            }
            bookingData.guests = selectedGuests;
            bookingData.foodType = selectedFoodType;
            bookingData.cost = pricing[selectedFoodType][selectedGuests] * selectedGuests;
        }
        
        if (currentService === 'tent') {
            const selectedTent = document.querySelector('.package-btn.active');
            if (!selectedTent) {
                alert('Please select a tent package');
                return;
            }
            bookingData.tentPackage = selectedTent.dataset.package;
            bookingData.cost = selectedTent.dataset.package === 'basic' ? 25000 : selectedTent.dataset.package === 'premium' ? 45000 : 75000;
        }
        
        if (currentService === 'decoration') {
            const selectedDecor = document.querySelector('.package-btn.active');
            if (!selectedDecor) {
                alert('Please select a decoration theme');
                return;
            }
            bookingData.decorationTheme = selectedDecor.dataset.package;
            const decorPrices = { traditional: 35000, modern: 40000, royal: 60000, floral: 50000 };
            bookingData.cost = decorPrices[selectedDecor.dataset.package];
        }
        
        if (currentService === 'cardecor') {
            const selectedCarDecor = document.querySelector('.package-btn.active');
            if (!selectedCarDecor) {
                alert('Please select a car decoration style');
                return;
            }
            bookingData.carDecoration = selectedCarDecor.dataset.package;
            const carDecorPrices = { simple: 5000, premium: 10000, luxury: 15000, royal: 25000 };
            bookingData.cost = carDecorPrices[selectedCarDecor.dataset.package];
        }
    }
    
    // Store booking data in localStorage
    localStorage.setItem('cateringBooking', JSON.stringify(bookingData));
    
    // Redirect to booking details page
    window.location.href = 'catering-details.html';
}

// Close modal functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create modal element
    const modal = document.createElement('div');
    modal.id = 'serviceModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Service Details</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body" id="modalBody">
                Loading...
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close modal when clicking X
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
});