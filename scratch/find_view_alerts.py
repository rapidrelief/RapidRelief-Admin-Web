lines = open('src/pages/SuperAdmin.jsx', encoding='utf-8').readlines()
for i, l in enumerate(lines):
    if 'showViewAlertsModal' in l or 'superAdminAlerts' in l:
        print(f"{i+1}: {l.strip()}")
