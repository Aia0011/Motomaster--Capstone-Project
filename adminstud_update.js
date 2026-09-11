const fs = require('fs');

let html = "";
try {
    html = fs.readFileSync('c:/xampp/htdocs/motomaster/admindash.html', 'utf8');
} catch (e) {
    html = fs.readFileSync('c:/xampp/htdocs/motomaster/adminstud.html', 'utf8');
}

// replace the chart scripts
html = html.replace(/<!-- Chart Configuration Scripts -->[\s\S]*?(?=<\/body>)/i, '');

// update active link
html = html.replace(/<li class="nav-item active">\s*<i class="fa-solid fa-house"><\/i>\s*Dashboard\s*<\/li>/i, `<li class="nav-item" onclick="window.location.href='admindash.html'">
                <i class="fa-solid fa-house"></i>
                Dashboard
            </li>`);
html = html.replace(/<li class="nav-item" onclick="window.location.href='adminstud.html'">\s*<i class="fa-solid fa-users"><\/i>\s*My Students\s*<\/li>/i, `<li class="nav-item active">
                <i class="fa-solid fa-users"></i>
                My Students
            </li>`);

// Update search text
html = html.replace('placeholder="Search..."', 'placeholder="Search student..."');

// Replace the dashboard container
const newContainer = `
        <div class="dashboard-container">
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2 style="font-size: 18px; font-weight: 500; margin-bottom: 5px;">Students Management</h2>
                    <p style="color: var(--text-secondary); font-size: 12px;">Manage all students, their information, and assigned classes.</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12px;"><i class="fa-solid fa-arrow-up-from-bracket"></i> Import Students</button>
                    <button style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12px;"><i class="fa-solid fa-arrow-up-from-bracket"></i> Export</button>
                    <button style="background: var(--accent); border: none; color: white; padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: bold;"><i class="fa-solid fa-plus"></i> Add Student</button>
                </div>
            </div>

            <!-- Students KPIs Row -->
            <div class="kpi-row">
                <!-- Card 1 -->
                <div class="kpi-card" style="box-shadow: none;">
                    <div class="kpi-header" style="display:flex; align-items:center;">
                        <div class="kpi-icon" style="color: var(--accent); background: transparent; border: none; font-size: 24px;"><i class="fa-solid fa-users"></i></div>
                        <div style="display: flex; flex-direction: column;">
                            <div class="kpi-title" style="margin-left: 10px;">Total Students</div>
                            <div class="kpi-value" id="kpiTotalStudentsVal" style="margin-bottom: 0; text-align: left; margin-left: 10px;">0</div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 15px;">
                        <span style="color: var(--text-secondary);">Active Students</span>
                        <span style="color: var(--green); font-weight: bold;" id="kpiActiveVal">0</span>
                    </div>
                </div>
                <!-- Card 2 -->
                <div class="kpi-card" style="box-shadow: none;">
                    <div class="kpi-header" style="display:flex; align-items:center;">
                        <div class="kpi-icon" style="color: var(--accent); background: transparent; border: none; font-size: 24px;"><i class="fa-solid fa-user-plus"></i></div>
                        <div style="display: flex; flex-direction: column;">
                            <div class="kpi-title" style="margin-left: 10px;">Inactive Students</div>
                            <div class="kpi-value" id="kpiInactiveVal" style="margin-bottom: 0; text-align: left; margin-left: 10px;">0</div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 15px;">
                        <span style="color: var(--text-secondary);">Needs Support</span>
                        <span style="color: var(--red); font-weight: bold;" id="kpiNeedsSupportVal">0</span>
                    </div>
                </div>
                <!-- Card 3 -->
                <div class="kpi-card" style="box-shadow: none;">
                    <div class="kpi-header" style="display:flex; align-items:center;">
                        <div class="kpi-icon" style="color: var(--accent); background: transparent; border: none; font-size: 24px;"><i class="fa-solid fa-graduation-cap"></i></div>
                        <div style="display: flex; flex-direction: column;">
                            <div class="kpi-title" style="margin-left: 10px;">Average Class Score</div>
                            <div class="kpi-value" id="kpiClassAvgVal" style="margin-bottom: 0; text-align: left; margin-left: 10px;">0%</div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 15px;">
                        <span style="color: var(--text-secondary);">Overall Pass Rate</span>
                        <span style="color: var(--text-primary);" id="kpiPassRateVal">0%</span>
                    </div>
                </div>
            </div>

            <!-- Students Table Area -->
            <div class="panel" style="margin-top: 20px; padding: 0;">
                <!-- Filters -->
                <div style="display: flex; gap: 15px; padding: 15px 20px; border-bottom: 1px solid var(--border-color); align-items: center;">
                    <div class="search-bar" style="flex-grow: 1; background: transparent;">
                        <input type="text" id="studentSearchInput" placeholder="Search student by name or email..." style="width: 100%;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </div>
                    <select class="panel-select" id="statusFilter" style="background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 10px; font-size: 12px; min-width: 120px; border-radius: 5px;">
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
                
                <!-- Table -->
                <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 900px;">
                    <thead>
                        <tr style="color: var(--text-secondary); font-size: 10px; border-bottom: 1px solid var(--border-color);">
                            <th style="padding: 15px 20px; font-weight: normal;">STUDENT</th>
                            <th style="padding: 15px 10px; font-weight: normal;">EMAIL</th>
                            <th style="padding: 15px 10px; font-weight: normal;">SECTION / STRAND</th>
                            <th style="padding: 15px 10px; font-weight: normal;">TEACHER</th>
                            <th style="padding: 15px 10px; font-weight: normal;">PROGRESS</th>
                            <th style="padding: 15px 10px; font-weight: normal; text-align: center;">AVG. SCORE</th>
                            <th style="padding: 15px 10px; font-weight: normal; text-align: center;">STATUS</th>
                            <th style="padding: 15px 10px; font-weight: normal;">LAST ACTIVE</th>
                            <th style="padding: 15px 20px; font-weight: normal; text-align: center;">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="studentTableBody" style="font-size: 12px;">
                        <tr>
                            <td colspan="9" style="padding: 30px; text-align: center; color: var(--text-secondary);">Loading students data...</td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </div>
        </div>

    <script>
        let allStudents = [];

        function renderStudentsTable(students) {
            const tbody = document.getElementById('studentTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (students.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="padding: 30px; text-align: center; color: var(--text-secondary);">No student records found matching the criteria.</td></tr>';
                return;
            }

            students.forEach(s => {
                const initials = (s.first_name[0] || '') + (s.last_name[0] || '');
                const colors = ['#a0522d', '#6a5acd', '#d2691e', '#2e8b57', '#008b8b', '#4b0082', '#b8860b'];
                const colorCode = colors[s.student_id % colors.length];

                const statusColor = s.status === 'Active' ? 'var(--green)' : s.status === 'At Risk' ? 'var(--orange)' : 'var(--red)';
                const statusBg = s.status === 'Active' ? 'rgba(76,175,80,0.05)' : s.status === 'At Risk' ? 'rgba(217,119,6,0.05)' : 'rgba(244,67,54,0.05)';
                const statusBorder = s.status === 'Active' ? 'rgba(76,175,80,0.3)' : s.status === 'At Risk' ? 'rgba(217,119,6,0.3)' : 'rgba(244,67,54,0.3)';

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
                tr.innerHTML = \`
                    <td style="padding: 15px 20px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; color: #fff; background-color: \${colorCode};">\${initials}</div>
                            <span style="font-weight: 500;">\${s.first_name} \${s.last_name}</span>
                        </div>
                    </td>
                    <td style="padding: 15px 10px; color: var(--text-secondary);">\${s.email}</td>
                    <td style="padding: 15px 10px;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="color: var(--text-primary); font-weight: 500;">\${s.section}</span>
                            <span style="color: var(--text-secondary); font-size: 10px;">Automotive Servicing</span>
                        </div>
                    </td>
                    <td style="padding: 15px 10px; color: var(--text-secondary);">\${s.teacher_name}</td>
                    <td style="padding: 15px 10px; width: 180px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="progress-bar" style="height: 6px; background-color: #222; border-radius: 3px; flex-grow: 1; overflow: hidden; width: 100px;">
                                <div class="progress-fill" style="width: \${s.progress}%; height: 100%; background-color: var(--accent);"></div>
                            </div>
                            <span style="font-weight: bold; font-size: 11px;">\${s.progress}%</span>
                        </div>
                    </td>
                    <td style="padding: 15px 10px; text-align: center; font-weight: bold;">\${s.avg_score > 0 ? s.avg_score + '%' : '—'}</td>
                    <td style="padding: 15px 10px; text-align: center;">
                        <span style="color: \${statusColor}; border: 1px solid \${statusBorder}; padding: 3px 8px; border-radius: 4px; font-size: 10px; background: \${statusBg};">\${s.status}</span>
                    </td>
                    <td style="padding: 15px 10px; color: var(--text-secondary);">\${s.last_active}</td>
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

        function loadAdminStudents() {
            fetch('admin_data_api.php?action=get_students_data')
                .then(res => {
                    if (res.status === 403) {
                        window.location.href = 'adminlogin.html';
                        return;
                    }
                    return res.json();
                })
                .then(data => {
                    if (!data || !data.success) return;
                    allStudents = data.students;

                    // Compute aggregates
                    const totalCount = allStudents.length;
                    let activeCount = 0;
                    let inactiveCount = 0;
                    let atRiskCount = 0;
                    let totalScore = 0;
                    let scoredStudents = 0;
                    let overallPasses = 0;

                    allStudents.forEach(s => {
                        if (s.status === 'Active') activeCount++;
                        else if (s.status === 'At Risk') atRiskCount++;
                        else inactiveCount++;

                        if (s.avg_score > 0) {
                            totalScore += s.avg_score;
                            scoredStudents++;
                            if (s.avg_score >= 75) overallPasses++;
                        }
                    });

                    const avgClassScore = scoredStudents > 0 ? Math.round(totalScore / scoredStudents) : 0;
                    const passRate = totalCount > 0 ? Math.round((overallPasses / totalCount) * 100) : 0;

                    // Set metric texts
                    document.getElementById('kpiTotalStudentsVal').textContent = totalCount;
                    document.getElementById('kpiActiveVal').textContent = activeCount;
                    document.getElementById('kpiInactiveVal').textContent = inactiveCount;
                    document.getElementById('kpiNeedsSupportVal').textContent = atRiskCount;
                    document.getElementById('kpiClassAvgVal').textContent = avgClassScore + '%';
                    document.getElementById('kpiPassRateVal').textContent = passRate + '%';

                    renderStudentsTable(allStudents);
                })
                .catch(err => console.error('Error loading students:', err));
        }

        // Search Filter
        document.getElementById('studentSearchInput').addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();
            filterAndRender();
        });

        // Status Filter
        document.getElementById('statusFilter').addEventListener('change', filterAndRender);

        function filterAndRender() {
            const query = document.getElementById('studentSearchInput').value.toLowerCase().trim();
            const status = document.getElementById('statusFilter').value;

            const filtered = allStudents.filter(s => {
                const name = (s.first_name + ' ' + s.last_name).toLowerCase();
                const matchesSearch = name.includes(query) || s.email.toLowerCase().includes(query);
                const matchesStatus = status === 'all' || s.status === status;
                return matchesSearch && matchesStatus;
            });

            renderStudentsTable(filtered);
        }

        document.addEventListener('DOMContentLoaded', loadAdminStudents);
    </script>
`;

html = html.replace(/<div class="dashboard-container">[\s\S]*?(?=<footer>)/i, newContainer + '\n\n        ');

// write output
fs.writeFileSync('c:/xampp/htdocs/motomaster/adminstud.html', html);
console.log('adminstud.html reconstructed successfully.');
