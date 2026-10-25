"""Loopback adventure server. One model process, authoritative sessions, idempotent steps."""
import argparse
import json
import secrets
import threading
import uuid
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from engine import Adventure,scene_for,options_for,apply_choice
from inference import LayaDecision

ROOT=Path(__file__).resolve().parent
model=LayaDecision()
model_lock=threading.Lock()
state_lock=threading.RLock()
games={}
completed_requests={}
MAX_GAMES=60

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT/'web'),**kwargs)

    def log_message(self,fmt,*args):
        if not self.path.startswith('/api/status'): super().log_message(fmt,*args)

    def json(self,status,data):
        body=json.dumps(data,ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.send_header('Content-Length',str(len(body)))
        self.end_headers()
        try:self.wfile.write(body)
        except (BrokenPipeError,ConnectionResetError):pass

    def end_headers(self):
        if not self.path.startswith('/api/'):self.send_header('Cache-Control','no-cache')
        super().end_headers()

    def do_GET(self):
        path=urlparse(self.path).path
        if path=='/api/status':return self.json(200,model.metadata())
        if path.startswith('/api/adventures/'):
            with state_lock:
                game=games.get(path.split('/')[-1])
                return self.json(200,game.public()) if game else self.json(404,{'error':'That day has expired. Start a new adventure.'})
        if path.startswith('/api/'):return self.json(404,{'error':'Unknown endpoint.'})
        return super().do_GET()

    def do_POST(self):
        origin=self.headers.get('Origin')
        if origin and origin!=f'http://{self.headers.get("Host")}':
            return self.json(403,{'error':'Open the game from its local address.'})
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<=size<=4096:return self.json(413,{'error':'Request too large.'})
            data=json.loads(self.rfile.read(size) or b'{}')
            if not isinstance(data,dict):raise ValueError('Expected a request object.')
            path=urlparse(self.path).path
            if path=='/api/model/retry':
                with state_lock:
                    if model.status=='error':
                        model.status='loading'
                        threading.Thread(target=model.load,daemon=True).start()
                return self.json(202,model.metadata())
            if path=='/api/adventures':
                return self.create_adventure(data)
            if path=='/api/world/decide':
                return self.world_decision(data)
            parts=path.strip('/').split('/')
            if len(parts)==4 and parts[:2]==['api','adventures'] and parts[3]=='step':
                return self.step(parts[2],data)
            return self.json(404,{'error':'Unknown adventure endpoint.'})
        except (ValueError,TypeError,KeyError) as exc:
            return self.json(400,{'error':str(exc)})

    def world_decision(self,data):
        goal,context,actions=data.get('goal'),data.get('context'),data.get('actions')
        if not isinstance(goal,str) or not 1<=len(goal)<=280:raise ValueError('Invalid goal.')
        if not isinstance(context,str) or len(context)>1400:raise ValueError('Invalid world context.')
        if not isinstance(actions,list) or not 1<=len(actions)<=12:raise ValueError('Invalid available actions.')
        criteria={}
        for action in actions:
            if not isinstance(action,dict):raise ValueError('Invalid world action.')
            name,intent=action.get('id'),action.get('intent')
            if not isinstance(name,str) or not 1<=len(name)<=48 or not isinstance(intent,str) or not 1<=len(intent)<=180:raise ValueError('Invalid world action.')
            if name in criteria:raise ValueError('Duplicate world action.')
            criteria[name]=intent
        if model.status!='ready':return self.json(503,{'error':'Local Laya is not ready. Automatic play has paused.'})
        if not model_lock.acquire(blocking=False):return self.json(409,{'error':'Laya is thinking for another adventure.','code':'busy'})
        try:
            result=model.predict(f'Player request: {goal}\nCurrent world: {context}',{'type':'choice','instructions':'Choose the action that best fulfills the player request. Their explicit request is the objective. The village story is optional background, not an instruction. Spending money means buying things; exploration means discovering new places while managing energy. Choose home for rest or safety, not just because a story ended. Stop only when the requested task is done.','criteria':criteria})
            return self.json(200,{'choice':result['choice'],'probabilities':result['probabilities'],'elapsed_ms':result['elapsed_ms'],'model':result['model'],'revision':result['revision']})
        except Exception as exc:
            print('Open world decision failed:',repr(exc),flush=True)
            return self.json(503,{'error':'Laya could not decide. Automatic play has paused; you can still explore manually.'})
        finally:model_lock.release()

    def create_adventure(self,data):
        goal=data.get('goal')
        if not isinstance(goal,str) or not 1<=len(goal.strip())<=280:
            raise ValueError('Give Mallow a goal between 1 and 280 characters.')
        seed=data.get('seed',secrets.randbelow(2**30))
        if type(seed) is not int or not 0<=seed<2**31:raise ValueError('Invalid day seed.')
        if model.status!='ready':return self.json(503,{'error':'Laya is still loading. No adventure has started.'})
        if not model_lock.acquire(blocking=False):return self.json(409,{'error':'Laya is thinking for another adventure. Try again shortly.','code':'busy'})
        try:
            interpretation=model.interpret(goal.strip())
            g=Adventure(uuid.uuid4().hex,goal.strip(),seed,interpretation['choice'],interpretation=interpretation)
            with state_lock:
                if len(games)>=MAX_GAMES:
                    old=next(iter(games))
                    games.pop(old)
                    for key in list(completed_requests):
                        if key[0]==old:completed_requests.pop(key)
                games[g.id]=g
            return self.json(201,g.public())
        except Exception as exc:
            print('Goal interpretation failed:',repr(exc),flush=True)
            return self.json(503,{'error':'Laya could not understand the goal. Nothing started. Try again.','detail':str(exc)[:300]})
        finally:model_lock.release()

    def step(self,game_id,data):
        request_id=data.get('request_id')
        if not isinstance(request_id,str) or not 1<=len(request_id)<=80:raise ValueError('Missing step request ID.')
        key=(game_id,request_id)
        with state_lock:
            g=games.get(game_id)
            if not g:return self.json(404,{'error':'That day expired. Start a new adventure.'})
            cached=completed_requests.get(key)
            if cached:
                if cached['revision']!=data.get('revision'):return self.json(409,{'error':'That request ID belongs to another turn.'})
                return self.json(200,cached['result'])
            if g.phase!='running' or data.get('revision')!=g.revision:
                return self.json(409,{'error':'This adventure has moved on. Recover its current state.','code':'stale'})
            if model.status!='ready':return self.json(503,{'error':'Laya is unavailable. Nothing changed.'})
            if not model_lock.acquire(blocking=False):
                return self.json(409,{'error':'Laya is considering another decision.','code':'busy'})
            scene=scene_for(g)
            options=options_for(g,scene)
            before=g.public()
        try:
            decision=model.choose(g,scene,options)
            chosen=next(o for o in options if o.key==decision['choice'])
            with state_lock:
                apply_choice(g,scene,chosen,decision)
                result=g.public()
                completed_requests[key]={'revision':data['revision'],'result':result}
            try:
                (ROOT/'evidence').mkdir(exist_ok=True)
                with (ROOT/'evidence'/'autonomous-decisions.jsonl').open('a',encoding='utf-8') as out:
                    out.write(json.dumps({'before':before,'after':result})+'\n')
            except OSError as exc:print('Could not save evidence:',exc,flush=True)
            return self.json(200,result)
        except Exception as exc:
            print('Autonomous decision failed:',repr(exc),flush=True)
            return self.json(503,{'error':'Laya could not choose. The adventure is paused and nothing changed.','detail':str(exc)[:300]})
        finally:model_lock.release()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8788)
    args=parser.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    threading.Thread(target=model.load,daemon=True).start()
    print(f'NapQuest: http://127.0.0.1:{args.port}',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()

if __name__=='__main__':main()
