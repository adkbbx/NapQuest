import random,unittest
from engine import Adventure,scene_for,options_for,apply_choice

class EngineTests(unittest.TestCase):
    def test_many_reachable_days_have_legal_actions_and_end(self):
        seen=set()
        for seed in range(600):
            rng=random.Random(seed)
            g=Adventure('test','Have an adventure',seed,['lunch','glory','friends','rest'][seed%4])
            for turn in range(7):
                scene=scene_for(g);seen.add(scene.key)
                choices=options_for(g,scene)
                self.assertTrue(choices,(seed,scene.key))
                self.assertEqual(len({o.key for o in choices}),len(choices))
                apply_choice(g,scene,rng.choice(choices),{'test':True})
                self.assertEqual(g.revision,turn+1)
                self.assertTrue(all(getattr(g,k)>=0 for k in ['food','coins','energy','fame','trouble','naps']))
                self.assertLessEqual(g.energy,8)
            self.assertEqual(g.phase,'ended')
            self.assertIsNotNone(g.ending)
            with self.assertRaises(ValueError):apply_choice(g,scene,choices[0],{})
        self.assertGreaterEqual(len(seen),18,seen)

    def test_theft_summons_a_goose(self):
        g=Adventure('t','Get free lunch',3,'lunch')
        for action in ['orchard','steal']:
            scene=scene_for(g);option=next(o for o in options_for(g,scene) if o.key==action)
            apply_choice(g,scene,option,{})
        self.assertEqual(scene_for(g).key,'chase')
        self.assertIn('sandwich',scene_for(g).situation)
        self.assertEqual(g.food,3)

    def test_debt_and_grudges_change_later_scenes(self):
        for action,flag in [('borrow','owes_goblin'),('sneak','goblin_grudge')]:
            g=Adventure('t','Get home',8,'lunch')
            for key in ['market','sample',action]:
                scene=scene_for(g);apply_choice(g,scene,next(o for o in options_for(g,scene) if o.key==key),{})
            self.assertIn(flag,g.flags)
            scene=scene_for(g);apply_choice(g,scene,options_for(g,scene)[0],{})
            if action=='borrow':self.assertEqual(scene_for(g).key,'collector')

    def test_unaffordable_actions_are_not_offered(self):
        g=Adventure('t','Lunch',0,'lunch',coins=0)
        scene=scene_for(g);apply_choice(g,scene,next(o for o in options_for(g,scene) if o.key=='market'),{})
        self.assertNotIn('buy',[o.key for o in options_for(g,scene_for(g))])

if __name__=='__main__':unittest.main()
