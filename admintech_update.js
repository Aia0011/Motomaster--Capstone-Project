const fs = require('fs');

let html = "";
try {
    html = fs.readFileSync('c:/xampp/htdocs/motomaster/admindash.html', 'utf8');
} catch (e) {
    html = fs.readFileSync('c:/xampp/htdocs/motomaster/admintech.html', 'utf8');
}

// replace the chart scripts
html = html.replace(/<!-- Chart Configuration Scripts -->[\s\S]*?(?=<\/body>)/i, '');

// update active link
html = html.replace(/<li class="nav-item active">\s*<i class="fa-solid fa-house"><\/i>\s*Dashboard\s*<\/li>/i, `<li class="nav-item" onclick="window.location.href='admindash.html'">
                <i class="fa-solid fa-house"></i>
                Dashboard
            </li>`);
html = html.replace(/<li class="nav-item" onclick="window.location.href='admintech.html'">\s*<i class="fa-solid fa-chalkboard-user"><\/i>\s*Teachers\s*<\/li>/i, `<li class="nav-item active">
                <i class="fa-solid fa-chalkboard-user"></i>
                Teachers
            </li>`);

// Update search text
html = html.replace('placeholder="Search..."', 'placeholder="Search teacher..."');

// Replace the dashboard container
const newContainer = `
        <div class="dashboard-container">
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2 style="font-size: 18px; font-weight: 500; margin-bottom: 5px;">Teachers Management</h2>
                    <p style="color: var(--text-secondary); font-size: 12px;">Manage all teachers, their information, and assigned classes.</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12px;"><i class="fa-solid fa-arrow-up-from-bracket"></i> Export</button>
                    <button style="background: var(--accent); border: none; color: white; padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: bold;"><i class="fa-solid fa-plus"></i> Add Teacher</button>
                </div>
            </div>

            <!-- Teachers KPIs Row -->
            <div class="kpi-row" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <!-- Card 1 -->
                <div class="kpi-card" style="box-shadow: none;">
                    <div class="kpi-header" style="display:flex; align-items:center;">
                        <div class="kpi-icon" style="color: var(--accent); background: transparent; border: none; font-size: 24px;"><i class="fa-solid fa-users-rectangle"></i></div>
                        <div style="display: flex; flex-direction: column;">
                            <div class="kpi-title" style="margin-left: 10px;">Total Teachers</div>
                            <div class="kpi-value" id="kpiTotalTeachersVal" style="margin-bottom: 0; text-align: left; margin-left: 10px;">0</div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 15px;">
                        <span style="color: var(--text-secondary);">Active Teachers</span>
                        <span style="color: var(--green);" id="kpiActiveVal">0</span>
                    </div>
                </div>
                <!-- Card 2 -->
                <div class="kpi-card" style="box-shadow: none;">
                    <div class="kpi-header" style="display:flex; align-items:center;">
                        <div class="kpi-icon" style="color: var(--accent); background: transparent; border: none; font-size: 24px;"><i class="fa-solid fa-user-plus"></i></div>
                        <div style="display: flex; flex-direction: column;">
                            <div class="kpi-title" style="margin-left: 10px;">Inactive Teachers</div>
                            <div class="kpi-value" id="kpiInactiveVal" style="margin-bottom: 0; text-align: left; margin-left: 10px;">0</div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 15px;">
                        <span style="color: var(--text-secondary);">Specialization</span>
                        <span style="color: var(--text-primary);">Automotive</span>
                    </div>
                </div>
                <!-- Card 3 -->
                <div class="kpi-card" style="box-shadow: none;">
                    <div class="kpi-header" style="display:flex; align-items:center;">
                        <div class="kpi-icon" style="color: var(--accent); background: transparent; border: none; font-size: 24px;"><i class="fa-solid fa-shield-halved"></i></div>
                        <div style="display: flex; flex-direction: column;">
                            <div class="kpi-title" style="margin-left: 10px;">Average Classes</div>
                            <div class="kpi-value" style="margin-bottom: 0; text-align: left; margin-left: 10px;">3</div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 15px;">
                        <span style="color: var(--text-secondary);">System Role</span>
                        <span style="color: var(--text-primary);">Instructor</span>
                    </div>
                </div>
            </div>

            <!-- Teachers Table Area -->
            <div class="panel" style="margin-top: 20px; padding: 0;">
                <!-- Filters -->
                <div style="display: flex; gap: 15px; padding: 15px 20px; border-bottom: 1px solid var(--border-color); align-items: center;">
                    <div class="search-bar" style="flex-grow: 1; background: transparent;">
                        <input type="text" id="teacherSearchInput" placeholder="Search teacher by name or email..." style="width: 100%;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </div>
                    <select class="panel-select" id="statusFilter" style="background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 10px; font-size: 12px; min-width: 120px; border-radius: 5px;">
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
                
                <!-- Table -->
                <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 900px;">
                    <thead>
                        <tr style="color: var(--text-secondary); font-size: 10px; border-bottom: 1px solid var(--border-color);">
                            <th style="padding: 15px 20px; font-weight: normal;">TEACHER</th>
                            <th style="padding: 15px 10px; font-weight: normal;">EMAIL</th>
                            <th style="padding: 15px 10px; font-weight: normal;">STRAND / SECTION</th>
                            <th style="padding: 15px 10px; font-weight: normal; text-align: center;">CLASSES HANDLED</th>
                            <th style="padding: 15px 10px; font-weight: normal; text-align: center;">STATUS</th>
                            <th style="padding: 15px 10px; font-weight: normal;">LAST ACTIVE</th>
                            <th style="padding: 15px 20px; font-weight: normal; text-align: center;">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="teacherTableBody" style="font-size: 12px;">
                        <tr>
                            <td colspan="7" style="padding: 30px; text-align: center; color: var(--text-secondary);">Loading teachers data...</td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </div>
            
        </div>

    <script>
        let allTeachers = [];

        function renderTeachersTable(teachers) {
            const tbody = document.getElementById('teacherTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (teachers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="padding: 30px; text-align: center; color: var(--text-secondary);">No teacher records found matching the criteria.</td></tr>';
                return;
            }

            teachers.forEach(t => {
                const initials = (t.first_name[0] || '') + (t.last_name[0] || '');
                const colors = ['#eff6ff', '#f0fdf4', '#fff7ed', '#fdf4ff', '#ecfeff', '#fdf2f8'];
                const textColors = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#db2777'];
                const colorIdx = t.teacher_id % colors.length;
                const bgColor = colors[colorIdx];
                const textColor = textColors[colorIdx];

                const classesHtml = t.classes.map(c => 
                    \`<span style="color: var(--text-primary); border: 1px solid rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 10px; background: rgba(255, 255, 255, 0.05); margin: 2px; display: inline-block;">\${c}</span>\`
                ).join(' ');

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
                tr.innerHTML = \`
                    <td style="padding: 15px 20px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; color: \${textColor}; background-color: \${bgColor};">\${initials}</div>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: 500;">\${t.first_name} \${t.last_name}</span>
                                <span style="color: var(--text-secondary); font-size: 10px;">\${t.specialization}</span>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 15px 10px; color: var(--text-secondary);">\${t.email}</td>
                    <td style="padding: 15px 10px;">
                        <div style="display: flex; flex-direction: column;">
                            <span>\${t.specialization}</span>
                            <span style="color: var(--text-secondary); font-size: 10px;">\${t.classes[0] || 'BSMA 2A'}</span>
                        </div>
                    </td>
                    <td style="padding: 15px 10px; text-align: center;">
                        \${classesHtml}
                    </td>
                    <td style="padding: 15px 10px; text-align: center;">
                        <span style="color: var(--green); border: 1px solid rgba(76, 175, 80, 0.3); padding: 3px 8px; border-radius: 4px; font-size: 10px; background: rgba(76, 175, 80, 0.05);">\${t.status}</span>
                    </td>
                    <td style="padding: 15px 10px; color: var(--text-secondary);">\${t.last_active}</td>
                    <td style="padding: 15px 20px; text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button style="background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); width: 26px; height: 26px; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-pencil"></i></button>
                            <button style="background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); width: 26px; height: 26px; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-eye"></i></button>
                            <button style="background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.2); color: var(--red); width: 26px; height: 26px; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                \`;
                tbody.appendChild(tr);
            });
        }

        function loadAdminTeachers() {
            fetch('admin_data_api.php?action=get_teachers_data')
                .then(res => {
                    if (res.status === 403) {
                        window.location.href = 'adminlogin.html';
                        return;
                    }
                    return res.json();
                })
                .then(data => {
                    if (!data || !data.success) return;
                    allTeachers = data.teachers;

                    const totalCount = allTeachers.length;
                    let activeCount = 0;
                    let inactiveCount = 0;

                    allTeachers.forEach(t => {
                        if (t.status === 'Active') activeCount++;
                        else inactiveCount++;
                    });

                    // Set metric texts
                    document.getElementById('kpiTotalTeachersVal').textContent = totalCount;
                    document.getElementById('kpiActiveVal').textContent = activeCount;
                    document.getElementById('kpiInactiveVal').textContent = inactiveCount;

                    renderTeachersTable(allTeachers);
                })
                .catch(err => console.error('Error loading teachers:', err));
        }

        // Search Filter
        document.getElementById('teacherSearchInput').addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();
            filterAndRender();
        });

        // Status Filter
        document.getElementById('statusFilter').addEventListener('change', filterAndRender);

        function filterAndRender() {
            const query = document.getElementById('teacherSearchInput').value.toLowerCase().trim();
            const status = document.getElementById('statusFilter').value;

            const filtered = allTeachers.filter(t => {
                const name = (t.first_name + ' ' + t.last_name).toLowerCase();
                const matchesSearch = name.includes(query) || t.email.toLowerCase().includes(query);
                const matchesStatus = status === 'all' || t.status === status;
                return matchesSearch && matchesStatus;
            });

            renderTeachersTable(filtered);
        }

        document.addEventListener('DOMContentLoaded', loadAdminTeachers);
    </script>
`;

html = html.replace(/<div class="dashboard-container">[\s\S]*?(?=<footer>)/i, newContainer + '\n\n        ');

// write output
fs.writeFileSync('c:/xampp/htdocs/motomaster/admintech.html', html);
console.log('admintech.html reconstructed successfully.');
