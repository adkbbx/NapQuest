"""Real local Laya goal interpretation and autonomous decisions. No substitute policy."""
import os
import time
from pathlib import Path
from engine import MISSIONS

ROOT=Path(__file__).resolve().parent
os.environ.setdefault('HF_HOME',str(ROOT/'.cache'/'huggingface'))
os.environ.setdefault('HF_HUB_DISABLE_SYMLINKS_WARNING','1')
os.environ.setdefault('HF_HUB_DISABLE_XET','1')
MODEL='convaiinnovations/laya'
REVISION='7b928d828b7b0e022f929d9bd2e44165aa270148'

class LayaDecision:
    def __init__(self,device='cpu'):
        self.device=device
        self.router=None;self.status='loading';self.error='';self.load_ms=None

    def load(self):
        start=time.perf_counter()
        self.status,self.error='loading',''
        try:
            import torch
            from laya import Router
            torch.set_num_threads(min(4,os.cpu_count() or 1))
            router=Router(device=self.device,default='english',revision=REVISION)
            router.load('english')
            self.router=router
            self.load_ms=round((time.perf_counter()-start)*1000)
            self.status='ready'
        except Exception as exc:
            self.status,self.error='error',f'{type(exc).__name__}: {exc}'
            print('Laya loading failed:',self.error,flush=True)

    def metadata(self):
        return {'status':self.status,'error':self.error,'model':MODEL,'revision':REVISION,
                'device':self.device,'load_ms':self.load_ms,'offline':os.environ.get('HF_HUB_OFFLINE')=='1'}

    def predict(self,state,question):
        if self.status!='ready':
            raise RuntimeError('Laya is not ready. No decision was played.')
        start=time.perf_counter()
        result=self.router.predict(state,{'decision':question},model='english')
        usage=result.get('usage',{})
        if usage.get('truncated') or usage.get('state_tokens_dropped',0):
            raise ValueError('The decision exceeded the model context budget. No action was played.')
        answer=result['answers']['decision']
        if answer['choice'] not in question['criteria']:
            raise ValueError('Laya returned an unavailable choice.')
        probabilities=answer.get('probabilities',{})
        if set(probabilities)!=set(question['criteria']):
            raise ValueError('Laya returned incomplete scores.')
        return {'choice':answer['choice'],'probabilities':probabilities,
                'elapsed_ms':round((time.perf_counter()-start)*1000),'model':MODEL,
                'revision':REVISION,'device':self.device,'input':state,'question':question,'usage':usage}

    def interpret(self,goal):
        return self.predict(goal,{'type':'choice','instructions':"What is the main ambition in this player's goal?",
            'criteria':{'lunch':'Find food, lunch, snacks, or a meal.',
                        'glory':'Become royal, famous, powerful, or a local legend.',
                        'friends':'Make friends, help others, be kind, and avoid conflict.',
                        'rest':'Sleep, relax, conserve energy, or do as little work as possible.'}})

    def choose(self,g,scene,options):
        memories='; '.join(e['action_label'] for e in g.history[-3:]) or 'Just left home.'
        state=(f'Goal: {g.goal}\nMain ambition: {MISSIONS[g.mission]}.\n'
               f'Now: {scene.situation}\n'
               f'Resources: {g.coins} coins, {g.food} food, {g.energy}/8 energy. '
               f'{len(g.friends)} friends, {g.fame} fame, {g.trouble} trouble.\n'
               f'Consequences: {scene.callback or "None yet."}\n'
               f'Remember: {memories}.')
        question={'type':'choice','instructions':"Choose Mallow's next action to pursue the goal in this situation. Consider the current resources and consequences.",
                  'criteria':{o.key:o.intent for o in options}}
        return self.predict(state,question)
