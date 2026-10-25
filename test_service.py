"""Failure-boundary tests use explicit test adapters. verify.py uses real Laya."""
import json,threading,unittest
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from http.server import ThreadingHTTPServer
import app

class TestModel:
    status='ready'
    def interpret(self,goal):return {'choice':'lunch'}
    def choose(self,*args):raise RuntimeError('Deliberate model failure')

class ServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),app.Handler)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
        cls.url=f'http://127.0.0.1:{cls.server.server_port}'
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join()
    def setUp(self):
        self.original=app.model;app.model=TestModel()
    def tearDown(self):app.model=self.original
    def request(self,path,data=None,origin=None):
        headers={'Content-Type':'application/json'}
        if origin:headers['Origin']=origin
        request=Request(self.url+path,data=None if data is None else json.dumps(data).encode(),headers=headers)
        try:
            with urlopen(request,timeout=5) as response:return response.status,json.load(response)
        except HTTPError as exc:return exc.code,json.load(exc)
    def test_failure_leaves_entire_adventure_unchanged(self):
        _,g=self.request('/api/adventures',{'goal':'Get lunch','seed':41})
        path='/api/adventures/'+g['id']
        status,_=self.request(path+'/step',{'revision':0,'request_id':'failure'})
        self.assertEqual(status,503)
        _,after=self.request(path);self.assertEqual(after,g)
        self.assertFalse(app.model_lock.locked())
    def test_foreign_origin_and_invalid_goal(self):
        status,_=self.request('/api/adventures',{'goal':'Lunch'},'https://example.invalid')
        self.assertEqual(status,403)
        for goal in ['',42,'x'*281]:
            status,_=self.request('/api/adventures',{'goal':goal});self.assertEqual(status,400)
    def test_busy_and_stale_turn_cannot_change_resources(self):
        _,g=self.request('/api/adventures',{'goal':'Lunch'})
        path='/api/adventures/'+g['id']
        status,_=self.request(path+'/step',{'revision':9,'request_id':'stale'})
        self.assertEqual(status,409)
        app.model_lock.acquire()
        try:
            status,_=self.request(path+'/step',{'revision':0,'request_id':'busy'});self.assertEqual(status,409)
        finally:app.model_lock.release()
        _,after=self.request(path);self.assertEqual(g,after)

    def test_world_decision_validates_options_and_releases_inference(self):
        data={'goal':'Quiet the bell','context':'Need bridge wood','actions':[{'id':'wood','intent':'Gather wood'}]}
        for actions in [[],[{'id':'wood','intent':''}],data['actions']*2]:
            status,_=self.request('/api/world/decide',{**data,'actions':actions})
            self.assertEqual(status,400)
        status,_=self.request('/api/world/decide',data)
        self.assertEqual(status,503)
        self.assertFalse(app.model_lock.locked())
        app.model_lock.acquire()
        try:
            status,_=self.request('/api/world/decide',data)
            self.assertEqual(status,409)
        finally:app.model_lock.release()

    def test_world_decision_passes_real_available_actions_to_adapter(self):
        received=[]
        def predict(prompt,schema):
            received.append((prompt,schema))
            return {'choice':'wood','probabilities':{'wood':1},'elapsed_ms':1,'model':'explicit-test-adapter','revision':'test'}
        app.model.predict=predict
        status,result=self.request('/api/world/decide',{'goal':'Quiet the bell','context':'Need wood','actions':[{'id':'wood','intent':'Gather wood'}]})
        self.assertEqual(status,200)
        self.assertEqual(result['choice'],'wood')
        self.assertEqual(received[0][1]['criteria'],{'wood':'Gather wood'})
        self.assertIn('Quiet the bell',received[0][0])
        self.assertFalse(app.model_lock.locked())

if __name__=='__main__':unittest.main()
