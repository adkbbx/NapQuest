import unittest
from unittest.mock import patch
from hosting import public_origin,origin_allowed
from test_service import ServiceFixture
import app

class HostingConfigTests(unittest.TestCase):
    def test_exact_origin_and_local_default(self):
        self.assertEqual(public_origin({'SPACE_HOST':'adk-napquest.hf.space'}),'https://adk-napquest.hf.space')
        self.assertEqual(public_origin({'NAPQUEST_PUBLIC_ORIGIN':'https://game.example/'}),'https://game.example')
        self.assertTrue(origin_allowed('http://127.0.0.1:8788','127.0.0.1:8788'))
        self.assertFalse(origin_allowed('https://evil.example','127.0.0.1:8788'))
        self.assertFalse(origin_allowed('http://internal:7860','internal:7860','',True))
        self.assertTrue(origin_allowed('https://game.example','internal:7860','https://game.example',True))
        self.assertFalse(origin_allowed('https://game.example.evil','internal:7860','https://game.example',True))
        self.assertFalse(origin_allowed('https://game.example','internal:7860','https://other.example',True))
    def test_public_origin_rejects_paths_credentials_and_insecure_hosts(self):
        for value in ['https://game.example/path','https://user:password@game.example','https://game.example?x=1','http://game.example','javascript:alert(1)']:
            with self.assertRaises(ValueError):public_origin({'NAPQUEST_PUBLIC_ORIGIN':value})

class HostedHTTPTests(ServiceFixture):
    def test_https_proxy_accepts_own_origin_and_rejects_foreign(self):
        app.model.predict=lambda *args:{'choice':'wood','probabilities':{'wood':1},'elapsed_ms':1,'model':'explicit-test-adapter','revision':'test'}
        data={'goal':'Gather wood','context':'','actions':[{'id':'wood','intent':'Gather wood'}]}
        with patch.object(app,'HOSTED',True),patch.object(app,'PUBLIC_ORIGIN','https://game.example'):
            status,_=self.request('/api/world/decide',data,'https://game.example');self.assertEqual(status,200)
            status,_=self.request('/api/world/decide',data,'https://evil.example');self.assertEqual(status,403)
            status,_=self.request('/api/model/retry',{},'https://game.example');self.assertEqual(status,404)
            status,result=self.request('/api/health');self.assertEqual(status,200);self.assertEqual(result['server'],'ready')

if __name__=='__main__':unittest.main()
