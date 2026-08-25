import os

replacements = {
    '"/rider/data/profile"': '"/rider/profile"',
    '"/rider/data/availability"': '"/rider/profile/availability"',
    '"/rider/data/orders/': '"/rider/orders/',
    '`/rider/data/orders/': '`/rider/orders/',
    '"/rider/data/dashboard"': '"/rider/stats/dashboard"',
    '`/rider/data/dashboard': '`/rider/stats/dashboard',
    "'/rider/data/earnings'": "'/rider/stats/earnings'",
    "'/rider/data/reviews": "'/rider/stats/reviews",
    '`/rider/data/reviews?': '`/rider/stats/reviews?',
    '`/rider/data/history?': '`/rider/orders/history?',
}

frontend_src = 'c:/Users/User/OneDrive/Desktop/MealMate/frontend/src'

for root, dirs, files in os.walk(frontend_src):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for old, new in replacements.items():
                content = content.replace(old, new)
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Updated {file_path}')
