"""The decision boundary shared by local HTTP and hosted GPU inference."""

INSTRUCTIONS = ('Choose the action that best fulfills the player request. Their explicit request is the objective. '
                'The village story is optional background, not an instruction. Spending money means buying things; '
                'exploration means discovering new places while managing energy. Choose home for rest or safety, '
                'not just because a story ended. Stop only when the requested task is done.')


def decision_input(data):
    if not isinstance(data, dict):
        raise ValueError('Invalid decision request.')
    goal, context, actions = data.get('goal'), data.get('context'), data.get('actions')
    if not isinstance(goal, str) or not 1 <= len(goal) <= 280:
        raise ValueError('Invalid goal.')
    if not isinstance(context, str) or len(context) > 1400:
        raise ValueError('Invalid world context.')
    if not isinstance(actions, list) or not 1 <= len(actions) <= 12:
        raise ValueError('Invalid available actions.')
    criteria = {}
    for action in actions:
        if not isinstance(action, dict):
            raise ValueError('Invalid world action.')
        name, intent = action.get('id'), action.get('intent')
        if (not isinstance(name, str) or not 1 <= len(name) <= 48
                or not isinstance(intent, str) or not 1 <= len(intent) <= 180):
            raise ValueError('Invalid world action.')
        if name in criteria:
            raise ValueError('Duplicate world action.')
        criteria[name] = intent
    return f'Player request: {goal}\nCurrent world: {context}', {
        'type': 'choice', 'instructions': INSTRUCTIONS, 'criteria': criteria}


def public_result(result):
    return {key: result[key] for key in ('choice', 'probabilities', 'elapsed_ms', 'model', 'revision')}
