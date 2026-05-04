// `locations` array is now loaded from data.js

// --- TAB SWITCHING LOGIC ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove active class from all buttons and containers
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
        
        // Add active class to clicked button and target container
        const targetId = e.target.getAttribute('data-target');
        e.target.classList.add('active');
        document.getElementById(targetId).classList.add('active');
        
        // If switching to map, tell Leaflet to resize (fixes grey tile issue when map is hidden on load)
        if (targetId === 'map-view' && map) {
            setTimeout(() => map.invalidateSize(), 100);
        }
    });
});

// --- POPULATE MATRIX TABLE ---
const tbody = document.querySelector('#matrix-table tbody');
locations.forEach(loc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="col-location">
            <div style="font-size:1rem; margin-bottom:4px; font-weight: 700;">${loc.title}</div>
            <a href="${loc.link}" target="_blank" style="font-size:0.75rem; color:var(--accent-primary); text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                View Listing 
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
        </td>
        <td class="col-surroundings">
            <div style="font-weight:600; color:#fff; margin-bottom:6px;">${loc.neighborhood}</div>
            ${loc.surroundings}
        </td>
        <td class="col-space">
            <div style="font-weight:600; color:#fff; margin-bottom:6px;">Size: ${loc.size}</div>
            ${loc.rentableSpace}
        </td>
        <td class="col-financials">
            <div class="fin-item"><span class="fin-label">Rent</span><span class="fin-val">${loc.rent}</span></div>
            <div class="fin-item"><span class="fin-label">Takeover</span><span class="fin-val">${loc.takeover}</span></div>
        </td>
        <td class="col-fastfood">
            <span class="suitability-badge suit-${loc.fastFoodDoner.toLowerCase()}">${loc.fastFoodDoner}</span>
        </td>
        <td class="col-casual">
            <span class="suitability-badge suit-${loc.casualDiningKebab.toLowerCase()}">${loc.casualDiningKebab}</span>
        </td>
        <td class="col-rationale">
            <div>${loc.description}</div>
        </td>
    `;
    tbody.appendChild(tr);
});

// --- INITIALIZE LEAFLET MAP ---
const map = L.map('map', {
    zoomControl: false
}).setView([52.348, 4.89], 12);

L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
    className: 'dark-tiles'
}).addTo(map);

const createCustomIcon = (isActive = false) => {
    return L.divIcon({
        className: 'custom-marker-wrapper',
        html: `<div class="custom-marker" style="width: ${isActive ? '24px' : '16px'}; height: ${isActive ? '24px' : '16px'}; background-color: ${isActive ? '#fcd34d' : '#f59e0b'}; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); transition: all 0.3s ease;"></div>`,
        iconSize: isActive ? [24, 24] : [16, 16],
        iconAnchor: isActive ? [12, 12] : [8, 8]
    });
};

const markers = {};
let activeCardId = null;

const sidebarList = document.getElementById('locations-list');

locations.forEach(loc => {
    // Marker
    const marker = L.marker([loc.lat, loc.lng], { icon: createCustomIcon() }).addTo(map);
    
    const popupContent = `
        <div class="popup-title">${loc.title}</div>
        <div class="popup-detail">${loc.neighborhood}</div>
        <div class="popup-detail" style="margin-top: 4px; font-weight: 500;">Rent: ${loc.rent}</div>
    `;
    marker.bindPopup(popupContent);
    markers[loc.id] = marker;

    // Sidebar Card
    const card = document.createElement('div');
    card.className = 'location-card';
    card.id = `card-${loc.id}`;
    
    const suitedFor = [];
    if (loc.fastFoodDoner === 'Yes') suitedFor.push('Döner');
    if (loc.casualDiningKebab === 'Yes') suitedFor.push('Kebab');
    const tagText = suitedFor.length > 0 ? suitedFor.join(' & ') : 'Review Needed';

    card.innerHTML = `
        <div class="card-tag">${tagText}</div>
        <div class="card-title">${loc.title}</div>
        <div class="card-neighborhood">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${loc.neighborhood}
        </div>
        <div style="font-size: 0.8125rem; color: #94a3b8; line-height: 1.4;">
            ${loc.description}
        </div>
    `;
    
    card.addEventListener('click', () => {
        activateLocation(loc.id);
    });

    marker.addEventListener('click', () => {
        activateLocation(loc.id);
        document.getElementById(`card-${loc.id}`).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    sidebarList.appendChild(card);
});

const group = new L.featureGroup(Object.values(markers));
map.fitBounds(group.getBounds().pad(0.1));

function activateLocation(id) {
    if (activeCardId) {
        document.getElementById(`card-${activeCardId}`).classList.remove('active');
        markers[activeCardId].setIcon(createCustomIcon(false));
    }
    
    activeCardId = id;
    document.getElementById(`card-${id}`).classList.add('active');
    
    const marker = markers[id];
    marker.setIcon(createCustomIcon(true));
    marker.openPopup();
    
    map.flyTo(marker.getLatLng(), 15, {
        duration: 0.8
    });
}
