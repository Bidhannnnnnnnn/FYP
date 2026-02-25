# Time Slot Definitions and Multipliers

TIME_SLOT_CONFIG = {
    'late_night': {
        'label': 'Late Night',
        'hours': [0, 1, 2, 3, 4],
        'multiplier': 0.6,
        'description': 'Low visibility, discounted rate.'
    },
    'early_morning': {
        'label': 'Early Morning',
        'hours': [5, 6, 7],
        'multiplier': 0.8,
        'description': 'Moderate morning traffic.'
    },
    'peak_hour_morning': {
        'label': 'Peak Morning',
        'hours': [8, 9, 10],
        'multiplier': 1.6,
        'description': 'High visibility during commute.'
    },
    'midday': {
        'label': 'Midday',
        'hours': [11, 12, 13, 14, 15],
        'multiplier': 1.0,
        'description': 'Standard daytime visibility.'
    },
    'peak_hour_evening': {
        'label': 'Peak Evening',
        'hours': [16, 17, 18],
        'multiplier': 1.5,
        'description': 'Maximum evening exposure.'
    },
    'late_evening': {
        'label': 'Late Evening',
        'hours': [19, 20, 21, 22, 23],
        'multiplier': 0.6,
        'description': 'Nighttime visibility.'
    }
}

def get_multiplier_for_hour(hour):
    for slot, config in TIME_SLOT_CONFIG.items():
        if hour in config['hours']:
            return config['multiplier']
    return 1.0
