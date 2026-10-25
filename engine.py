"""A consequence-driven woodland. The director offers scenes. Laya chooses actions."""
from dataclasses import asdict, dataclass, field

MISSIONS = {'lunch':'Bring home something to eat','glory':'Become somebody in these woods',
            'friends':'Make friends and keep the peace','rest':'Have an aggressively restful day'}
PLACES = {'home':[190,375],'fork':[330,350],'market':[302,200],'orchard':[365,465],
          'pond':[735,440],'hill':[780,190],'bridge':[500,325],'ferns':[435,430],
          'stage':[730,325],'shelter':[690,220],'mushrooms':[365,230]}

@dataclass(frozen=True)
class Option:
    key: str
    label: str
    intent: str
    story: str
    quip: str
    effects: dict

def O(key,label,intent,story,quip,**effects):
    return Option(key,label,intent,story,quip,effects)

@dataclass(frozen=True)
class Scene:
    key: str
    title: str
    situation: str
    place: str
    npc: str
    options: tuple
    callback: str = ''

def S(key,title,situation,place,npc,*options,callback=''):
    return Scene(key,title,situation,place,npc,options,callback)

@dataclass
class Adventure:
    id: str
    goal: str
    seed: int
    mission: str
    phase: str = 'running'
    revision: int = 0
    energy: int = 6
    coins: int = 3
    food: int = 0
    fame: int = 0
    trouble: int = 0
    naps: int = 0
    spent: int = 0
    friends: list = field(default_factory=list)
    items: list = field(default_factory=list)
    flags: list = field(default_factory=list)
    history: list = field(default_factory=list)
    interpretation: dict = field(default_factory=dict)
    ending: dict | None = None

    def public(self):
        result=asdict(self)
        result.update(mission_label=MISSIONS[self.mission],max_turns=7,
                      day=['Tuesdayish','Almost Friday','The Long Sunday','Second Breakfast Day'][self.seed%4],
                      next_scene=scene_public(scene_for(self)) if self.phase=='running' else None)
        return result

def scene_public(s):
    return {'key':s.key,'title':s.title,'situation':s.situation,'place':s.place,
            'position':PLACES[s.place],'npc':s.npc,'callback':s.callback}

def options_for(g,s):
    return [o for o in s.options if all(getattr(g,k)+o.effects.get(k,0)>=0 for k in ('coins','food','energy'))]

def scene_for(g):
    n=len(g.history)
    if n==0:
        return S('fork','An ambitious departure','Four trails leave home. Mallow has three coins and an empty lunch bag.','fork','sign',
            O('market','Follow the smell of lunch','Buy lunch at the market, usually by spending coins.',
              'Mallow follows a smell he describes as financially irresponsible.','I packed an appetite. That counts.',energy=-1,flags=['route_market'],animation='sniff'),
            O('orchard','Try the unguarded orchard','Get free fruit or steal picnic food without spending money.',
              'A sign says PRIVATE ORCHARD. Mallow reads it as a very small suggestion.','Free-range means free, right?',energy=-1,flags=['route_orchard'],animation='sneak'),
            O('pond','Meet the ducks','Make friends by visiting the pond.',
              'Mallow waves at a duck. The duck consults another duck.','Strong first impression. No screaming.',energy=-1,flags=['route_pond'],animation='wave'),
            O('hill','Investigate the royal flag','Seek glory, status, a crown or adventure.',
              'Mallow sees a flag on a hill and assumes there is a vacancy for king.','Finally. A job I can do sitting down.',energy=-2,flags=['route_hill'],animation='brave'),
            O('rest','Inspect the nearest patch of shade','Find a quiet place to sleep and conserve energy.',
              'Mallow leaves home, turns around, and rates the shade outside home five stars.','Travel broadens the mattress.',energy=2,naps=1,flags=['route_rest'],animation='nap'))
    if g.energy==0 and n<6:
        return S('rescue','The legs have resigned','A snail with a wheelbarrow offers emergency transport.','ferns','snail',
            O('ride','Accept the emergency snail','Rest and accept help.',
              'The snail overtakes Mallow, reverses, and loads him into a wheelbarrow. Humbling.','Tell nobody I was the slow one.',energy=3,friend='Emergency Snail',flags=['rescued'],animation='ride'),
            O('pay','Hire the premium wheelbarrow','Pay for a more comfortable rest.',
              'For one coin, the snail adds a leaf cushion. Mallow calls it business class.','Expense this to adventuring.',energy=3,coins=-1,animation='ride'),
            callback='Earlier exertion has finally caught up with those extremely short legs.')
    if n==1:
        if 'route_orchard' in g.flags:
            return S('orchard','The unattended sandwich','A fox guards the picnic. Fallen pears are free. A sandwich is labelled KEVIN.','orchard','fox',
                O('gather','Gather fallen pears','Get free food honestly.',
                  'Mallow gathers windfall pears. One is shaped like a very judgmental face.','Nature has a generous return policy.',food=2,energy=-1,item='judgmental pear',animation='eat'),
                O('steal','Liberate the named sandwich','Take the best lunch without paying.',
                  'Mallow steals a sandwich labelled KEVIN. Kevin is the fox. Kevin has noticed.','A victimless crime, if Kevin blinks.',food=3,trouble=2,flags=['stole_lunch'],animation='steal'),
                O('help','Help the fox pick apples','Make a friend and earn a snack by helping.',
                  'Mallow picks two apples in nine minutes. Kevin pays him to stop helping.','A very generous severance package.',food=1,fame=1,friend='Kevin the Fox',energy=-1,animation='wave'),
                O('nap','Sleep under the apple tree','Rest and conserve effort.',
                  'An apple lands in his bag while he sleeps. Mallow promotes himself to farmer.','I have diversified into agriculture.',food=1,energy=2,naps=1,animation='nap'))
        if 'route_pond' in g.flags:
            return S('pond','A duck-shaped opportunity','The ducks require a favor, a snack, or evidence of royal ancestry.','pond','duck',
                O('befriend',"Rescue a duckling's hat",'Help the ducks and make friends.',
                  'Mallow retrieves a hat from a puddle. Three ducks immediately adopt him.','I appear to have dependants.',energy=-1,friend='The Duck Committee',flags=['duck_friend'],item='tiny wet hat',animation='ducks'),
                O('royalty','Declare yourself their king','Become royalty and gain fame.',
                  'The ducks crown Mallow with pondweed. Their constitution is apparently very relaxed.','I accept this unpaid position.',fame=3,item='pondweed crown',flags=['duck_king'],animation='crown'),
                O('fish','Ask where the snacks grow','Find free food.',
                  'A duck shows Mallow the watercress. He takes notes. The notes say LUNCH.','Networking is edible.',food=2,friend='One Helpful Duck',animation='eat'),
                O('float','Float on a large leaf','Rest quietly on the pond.',
                  'Mallow floats three feet and calls it a cruise. The duck charges a docking fee in disapproval.','All-inclusive. Except ambition.',energy=2,naps=1,animation='nap'))
        if 'route_hill' in g.flags:
            return S('hill','The throne is technically vacant','A stump wears a cardboard crown. A squirrel sells royal certificates for two coins.','hill','squirrel',
                O('crown','Put on the cardboard crown','Become a king for free.',
                  'Mallow crowns himself. The stump files no objection. The squirrel calls security.','A unanimous election. I was the electorate.',fame=3,trouble=1,item='cardboard crown',flags=['self_crowned'],animation='crown'),
                O('certificate','Buy a royal certificate','Pay for legitimate status.',
                  'The leaf certificate says KING-ISH. The squirrel will not discuss refunds.','The hyphen is legally significant.',coins=-2,fame=2,item='KING-ISH certificate',animation='coin'),
                O('help','Help the squirrel find his crown','Be kind and make a friend.',
                  'It was on the stump all along. The squirrel thanks Mallow for his discretion.','Your secret is safe. Your acorn is lunch.',friend='Embarrassed Squirrel',food=1,animation='wave'),
                O('rest','Use the throne as a pillow','Ignore glory and take a nap.',
                  'The velvet throne cushion is moss. Mallow finds the branding aspirational.','I rule out doing anything.',energy=3,naps=1,animation='nap'))
        if 'route_rest' in g.flags:
            return S('rest_grove','A professional sleeper','A snail tests luxury moss mattresses. It needs a second opinion and has snacks.','mushrooms','snail',
                O('test','Take the mattress trial','Sleep, relax, and recover energy.',
                  'Mallow falls asleep during the introduction. The snail writes EXCEPTIONAL COMMITMENT.','Finally, transferable skills.',energy=2,naps=1,item='certified moss tester',animation='nap'),
                O('snack','Volunteer for the snack test','Get free food.',
                  "The quality-control biscuits fail to leave Mallow's mouth. He approves the batch.",'Another batch, for statistical confidence.',food=2,animation='eat'),
                O('chat','Ask the snail about its day','Make a friend through kindness.',
                  'They discuss taking things slowly. It is the fastest conversation either has ever had.','We should do less together sometime.',friend='Moss Mattress Snail',fame=1,animation='wave'))
        price=1+g.seed%2
        return S('market','Lunch has a price tag',f'A frog sells giant sandwiches for {price} coins. Free samples sit beside an alarming tip jar.','market','frog',
            O('buy','Buy the giant sandwich','Spend money to get plenty of food.',
              f'Mallow buys lunch for {price} coins. The sandwich is wider than his professional ambitions.','A diversified lunch portfolio.',coins=-price,food=3,animation='coin'),
            O('sample','Become a repeat sample customer','Get lunch without spending money.',
              'Mallow queues again wearing a different leaf. The frog recognizes his entire body.','No, the other sloth was my cousin.',food=2,trouble=1,flags=['sample_fraud'],animation='steal'),
            O('help','Wash a single dish','Help the merchant and earn friendship and food.',
              'Mallow washes one plate. The frog awards him soup and employee of the minute.','I shall retire at my peak.',food=1,friend='Soup Frog',fame=1,energy=-1,animation='wave'),
            O('nap','Sleep beneath the table','Avoid effort and take a rest.',
              'The frog places a RESERVED sign beside Mallow. A successful hospitality partnership.','Wake me for checkout.',energy=2,naps=1,animation='nap'))
    if n==2 and 'stole_lunch' in g.flags:
        return S('chase','Kevin would like a word','The fox you robbed has hired a goose. The goose is gaining on your sandwich.','ferns','goose',
            O('return','Give the sandwich back','Make peace and avoid trouble.',
              "Mallow returns Kevin's sandwich. The goose invoices for emotional honking.",'I was only testing your security.',food=-2,trouble=-2,fame=1,friend='Kevin the Fox',clear=['stole_lunch'],animation='wave'),
            O('run','Keep lunch and flee','Protect food without spending money.',
              'Mallow escapes at four miles per afternoon. The goose stops to reconsider its career.','You cannot tax what you cannot catch.',energy=-2,trouble=1,flags=['goose_grudge'],animation='chase'),
            O('bribe','Pay the goose to look elsewhere','Spend a coin to end the confrontation.',
              'The goose takes a coin and announces that justice has been served.','A flexible legal system.',coins=-1,trouble=-1,friend='Corrupt Goose',animation='coin'),
            O('nap','Pretend to be a decorative log','Conserve energy and rest.',
              'Mallow lies down. The goose sits on him. He is now fugitive and furniture.','This is not the escape I ordered.',energy=2,naps=1,item='goose passenger',animation='nap'),
            callback='That sandwich had a name on it. Kevin remembered yours.')
    if n==2 and any(f in g.flags for f in ['duck_king','self_crowned']):
        return S('coronation','Your subjects have demands','The new ruler must provide a feast, a speech, or competent duck management.','stage','duck',
            O('speech','Make an empty royal promise','Gain fame without spending resources.',
              'Mallow promises longer weekends. The ducks demand it in writing. He cannot hold a pen.','My first decree: later.',fame=2,flags=['weekend_promise'],animation='crown'),
            O('feast','Share the royal lunch','Feed everybody and make friends.',
              'One snack becomes a state banquet. The ducks elect Mallow king again, just to be sure.','A fiscally tiny feast.',food=-1,fame=2,friend='The Duck Committee',flags=['duck_friend'],animation='ducks'),
            O('abdicate','Abdicate in favor of a pebble','Avoid responsibility and get rest.',
              'King Pebble assumes office. Its approval rating is immediate and unanimous.','A smooth transition of power.',energy=2,naps=1,trouble=-1,item='royal pension pebble',clear=['self_crowned','duck_king'],flags=['abdicated'],animation='nap'),
            callback='You put on a crown. Apparently that comes with meetings.')
    if n==2 and 'duck_friend' in g.flags:
        return duck_scene('Your duck committee has reconvened. Nobody brought an agenda.')
    if n==2: return bridge_scene()
    if n==3 and g.trouble>=2:
        return S('trial','The woodland small-claims court','An owl hears complaints about your afternoon. A goose acts as prosecutor.','hill','owl',
            O('apologize','Offer a sincere apology','Resolve conflict peacefully without spending money.',
              'The owl reduces the sentence to being slightly embarrassed in public.','I plead mostly sleepy.',trouble=-2,fame=-1,friend='Judge Hoot',animation='wave'),
            O('fine','Pay the fine','Spend money to settle the dispute.',
              'The owl stamps PAID. The goose stamps HONK. Both consider this due process.','A two-stamp justice system.',coins=-1,trouble=-2,animation='coin'),
            O('royal','Claim diplomatic immunity','Use royal authority and confidence to gain reputation.',
              'Mallow points at his head. The owl writes EXTREMELY CONFIDENT in the case notes.','You cannot arrest the concept of monarchy.',fame=2,trouble=1,flags=['owl_grudge'],animation='crown'),
            O('sleep','Sleep through the hearing','Rest rather than argue.',
              'Court adjourns because the defendant is snoring over the evidence.','I rest my case. Literally.',energy=2,naps=1,flags=['court_snooze'],animation='nap'),
            callback='Your earlier choices have accumulated paperwork.')
    if n==3 and g.fame>=2:
        return S('stage','A worrying amount of applause','A squirrel offers a microphone. The audience believes you know what you are doing.','stage','squirrel',
            O('perform','Perform a heroic reenactment of lunch','Become famous and earn money.',
              'Mallow takes seven minutes to mime eating. A critic calls it uncomfortably authentic.','I rehearsed at breakfast.',fame=2,coins=1,energy=-1,animation='crown'),
            O('friend','Invite a shy duck onstage','Help someone else and make a friend.',
              'The duck says HONK once. Standing ovation. Mallow has discovered management.','My client accepts payment in crumbs.',friend='Stagefright Duck',fame=1,animation='ducks'),
            O('nap','Make the performance a live nap','Rest and do the least work.',
              'The audience stays silent for The Nap. Two people weep.','Art should let you lie down.',naps=1,energy=2,fame=1,animation='nap'),
            callback='Your earlier reputation has attracted an actual audience.')
    if n==3:
        return S('mushrooms','The mushrooms are unionized','A mushroom choir trades snacks for help, a song, or a legally binding compliment.','mushrooms','mushroom',
            O('compliment','Compliment their little hats','Make friends through kindness.',
              'The mushrooms give Mallow a biscuit and start a fan club.','That is some powerful headwear.',friend='Mushroom Choir',food=1,fame=1,animation='wave'),
            O('forage','Ask for the edible mushroom guide','Collect free food to bring home.',
              'The choir supplies a snack basket with one rule: no eating the tenors.','I respect artists. Especially crunchy ones.',food=2,item='mushroom biscuit',animation='eat'),
            O('nap','Ask for a lullaby','Sleep and recover energy.',
              'The choir sings Mallow to sleep. They charge his snores as percussion.','Put me down as a session musician.',energy=3,naps=1,animation='nap'))
    if n==4 and 'owes_goblin' in g.flags:
        return S('collector','Your tab has legs','The goblin has followed you with a ledger. That loan was not a gift.','bridge','goblin',
            O('repay','Settle the debt','Honor the agreement and avoid trouble.',
              'The goblin crosses out your name with a flourish usually reserved for villains.','We can both stop saying fiscal now.',coins=-1,trouble=-1,friend='Bridge Goblin',clear=['owes_goblin'],animation='coin'),
            O('food','Repay in lunch','Share food and make peace.',
              'The goblin accepts lunch as legal tender. Inflation has never tasted better.','A sandwich-backed economy.',food=-1,trouble=-1,friend='Bridge Goblin',clear=['owes_goblin'],animation='eat'),
            O('run','Blame your cousin','Keep money and food by dodging responsibility.',
              'The goblin draws a wanted poster of your cousin. It looks exactly like you.','A striking family resemblance.',trouble=2,flags=['goblin_grudge'],animation='chase'),
            O('nap','Enter temporary hibernation','Rest and delay the conversation.',
              'The goblin waits. Interest is now accruing in sighs.','My accounts are currently dormant.',energy=2,naps=1,trouble=1,animation='nap'),
            callback='You borrowed a toll earlier. The ledger has not forgotten.')
    if n==4 and 'duck_king' in g.flags:
        return duck_scene('Your royal pondweed crown has summoned more constituents.')
    if n==4 and g.seed%2==0:
        return S('rain','A very local weather event','It rains directly on Mallow. A badger occupies a dry hollow and an excellent blanket.','shelter','badger',
            O('share','Ask to share the hollow','Make a friend and find shelter.',
              'The badger scoots over. Mallow discovers the radical technology of asking nicely.','Room service is mostly acorns.',energy=1,friend='Blanket Badger',animation='wave'),
            O('leaf','Wear an enormous leaf umbrella','Keep moving without spending money.',
              'The leaf works until a duck declares it public transport. Mallow is damp and now a bus.','Next stop: wherever my feet give up.',energy=-1,flags=['wet'],item='duck-approved umbrella',animation='rain'),
            O('sleep','Join the blanket nap','Get comfortable and sleep.',
              'The badger applies an emergency blanket. The emergency is now being too comfortable.','Cancel my outside appointment.',energy=3,naps=1,friend='Blanket Badger',animation='nap'))
    if n==4:
        return S('bees','An unsolicited business opportunity','Bees offer free honey if you become their brand ambassador. There is no salary.','orchard','bee',
            O('honey','Take the honey and the job','Get free food despite the consequences.',
              'Mallow gets honey. The bees get a walking billboard. The billboard is sticky and concerned.','I should have read the buzzword section.',food=2,flags=['bee_contract'],item='suspicious honey jar',animation='bees'),
            O('friend','Rescue a tired bee','Make friends without signing a contract.',
              'The hive awards a tiny medal for outstanding slowness.','A union with excellent snacks.',friend='Bee Local 404',fame=1,food=1,animation='wave'),
            O('avoid','Politely decline and lie down','Avoid trouble and rest.',
              'The bees respect his boundaries, then try selling to a rock.','I am not currently scaling.',energy=2,naps=1,animation='nap'))
    if n==5 and 'goblin_grudge' in g.flags:
        return S('revenge','Bridge maintenance is personal','The goblin has installed a toll on the way home. It is named the Mallow Tax.','bridge','goblin',
            O('sorry','Apologize and offer lunch','Repair the relationship and end the conflict.',
              'The Mallow Tax is renamed the Friendship Contribution.','A historic peace snack.',food=-1,trouble=-2,friend='Bridge Goblin',clear=['goblin_grudge'],animation='wave'),
            O('sneak','Take the muddy fern detour','Keep food and money by sneaking around the toll.',
              'The ferns welcome their most reliable customer.','The scenic route has opinions about my shoes.',energy=-2,flags=['muddy'],animation='sneak'),
            O('pay','Pay the personal tax','Spend money to get home safely.',
              'The receipt says YOU KNOW WHAT YOU DID.','Can I deduct character development?',coins=-1,trouble=-1,animation='coin'),
            O('sleep','Wait for the lunch break','Rest until passage is possible.',
              'Mallow naps until the goblin clocks out. Even grudges have office hours.','Patience is cheaper than infrastructure.',energy=2,naps=1,animation='nap'),
            callback='That earlier goblin incident now has its own tax code.')
    if n==5 and 'bee_contract' in g.flags:
        return S('bee_review','Your performance review is buzzing','The bees demand an advertisement. They have prepared a 94-slide deck.','stage','bee',
            O('pitch','Perform the honey advertisement','Honor your promise and gain fame.',
              'Mallow says BUY HONEY. The bees call it refreshingly authentic.','Available for extremely small partnerships.',fame=2,trouble=1,energy=-1,animation='bees'),
            O('quit','Return a snack and resign','Avoid trouble and leave the job.',
              'His exit interview is mostly buzzing.','I am pursuing other horizontal opportunities.',food=-1,clear=['bee_contract'],trouble=-1,animation='wave'),
            O('sleep','Sleep through the slide deck','Rest rather than work.',
              'The bees finish 94 slides. Mallow wakes refreshed and accidentally promoted.','I assume this comes with less work.',energy=2,naps=1,fame=1,item='regional honey manager',animation='nap'),
            callback='Free honey came with terms and conditions.')
    if n==5 and g.food==0:
        return S('last_snack','The lunch bag echoes','A frog has one last snack. It can be bought, earned, or dramatically begged for.','market','frog',
            O('buy','Buy the emergency snack','Get food before going home.',
              'The receipt says AVOIDABLE.','Preparedness, slightly late.',coins=-1,food=2,animation='coin'),
            O('work','Help stack three bowls','Earn free food honestly.',
              'Only two bowls fall over. The frog calls it progress.','My references are available on request.',energy=-1,food=2,friend='Soup Frog',animation='wave'),
            O('beg','Make a tragic hungry face','Get food without money or much effort.',
              'The frog gives Mallow a biscuit to stop looking like that.','This face is a renewable resource.',food=1,fame=-1,animation='eat'),
            O('skip','Accept a lunch-free lifestyle','Rest and avoid more work.',
              'Mallow declares lunch a social construct. His stomach files a dissent.','I am spiritually full.',energy=2,naps=1,animation='nap'),
            callback='The empty bag is a consequence of your earlier priorities.')
    if n==5:
        return S('picnic','The snack redistribution committee','A duck and squirrel have noticed your lunch. Share it or save it for home?','pond','duck',
            O('keep','Keep lunch for yourself','Preserve food to bring home.',
              'Mallow protects the bag with the steely resolve of someone who skipped breakfast.','This meeting could have been my sandwich.',animation='eat'),
            O('share','Share a snack with everyone','Be generous and make friends.',
              'The duck provides a toast. It is just HONK, but heartfelt.','A small crumb for me. A big crumb for diplomacy.',food=-1,fame=1,friend='Picnic Neighbors',animation='ducks'),
            O('nap','Eat later. Nap now.','Rest before going home.',
              'The squirrel puts a tiny DO NOT DISTURB leaf on Mallow.','Please respect the leaf.',energy=2,naps=1,animation='nap'),
            callback='Your earlier choices brought this lunch bag and this audience together.')
    if n>=6:
        return S('home','The home stretch','Home is in sight. Make one final decision about the spoils of the afternoon.','home','sign',
            O('stash','Bring everything home','Keep your food, money, and souvenirs.',
              'Mallow returns with his possessions and a version of events his mother might believe.','A success, depending on the definition.',energy=1,animation='home'),
            O('share','Invite the woods over','Celebrate with friends and share food.',
              'Mallow announces a housewarming despite already living here. The ducks bring themselves.','Bring a chair. Or be a chair.',food=-1,fame=2,friend='Picnic Neighbors',animation='ducks'),
            O('parade','Make a grand entrance','Show off and become a local legend.',
              'Most of the applause is a goose hitting a bin. Applause is applause.','Hold questions until after my statue.',fame=2,energy=-1,animation='crown'),
            O('nap','Sleep on the doorstep','Finish with a well-earned rest.',
              'Mallow reaches the doorstep and powers down. Adventure can leave a message.','Home is where you stop trying.',energy=3,naps=1,animation='nap'))
    raise ValueError('No scene for this state.')

def bridge_scene():
    return S('bridge','The bridge has a business model','A goblin asks for one coin to cross. A fern trail goes around the booth.','bridge','goblin',
        O('pay','Pay the toll','Spend money to cross peacefully.',
          'The goblin congratulates Mallow on supporting local inconvenience.','A growth industry.',coins=-1,animation='coin'),
        O('sneak','Sneak through the ferns','Cross without spending money, at the cost of effort and an annoyed goblin.',
          'The goblin recognizes the leaf cape and writes a little name in a little book.','A deeply discreet outfit, in hindsight.',energy=-1,trouble=1,flags=['goblin_grudge'],animation='sneak'),
        O('friend','Straighten the toll sign','Make friends by helping instead of paying.',
          'The goblin waives the toll and admits the job is mostly loneliness.','We all have bridges to maintain.',energy=-1,friend='Bridge Goblin',flags=['goblin_friend'],animation='wave'),
        O('borrow','Promise to pay later','Keep money now by taking on a debt.',
          'Mallow opens a tab. The goblin opens a ledger. Different levels of commitment.','Put it on my extremely future account.',flags=['owes_goblin'],animation='shrug'),
        O('nap','Wait for the collector to nap','Rest until crossing takes no effort.',
          'Mallow naps. The goblin naps. Both call this a sophisticated negotiation.','A horizontal ceasefire.',energy=2,naps=1,animation='nap'))

def duck_scene(callback):
    return S('duck_committee','A convoy nobody ordered','Three ducks offer friendship, a crown, and absolutely no personal space.','pond','duck',
        O('adopt','Accept the duck entourage','Make lasting friends.',
          'None of his new followers can read, but engagement is exceptional.','Finally, an audience for my pace.',friend='The Duck Committee',flags=['duck_friend'],animation='ducks'),
        O('crown','Request a duck coronation','Become a famous ruler.',
          'The ducks crown Mallow with pondweed and demand a pondweed budget.','I take your quacks seriously.',fame=3,item='pondweed crown',flags=['duck_king'],animation='crown'),
        O('snack','Trade gossip for a snack','Get free food.',
          'A duck swaps lunch for squirrel gossip. Woodland journalism is thriving.','Sources close to the acorn confirm.',food=2,animation='eat'),
        O('rest','Ask the ducks to guard your nap','Rest with friends nearby.',
          'Every falling leaf receives a formal warning.','The finest security crumbs can buy.',energy=2,naps=1,friend='The Duck Committee',animation='nap'),
        callback=callback)

def apply_choice(g,s,o,evidence):
    if g.phase!='running' or s.key!=scene_for(g).key or o not in options_for(g,s):
        raise ValueError('That action is not available in this state.')
    before={k:getattr(g,k) for k in ('energy','coins','food','fame','trouble','naps')}
    for k in before:
        setattr(g,k,max(0,min(8 if k=='energy' else 20,getattr(g,k)+o.effects.get(k,0))))
    g.spent+=max(0,-o.effects.get('coins',0))
    for k,collection in [('friend',g.friends),('item',g.items)]:
        v=o.effects.get(k)
        if v and v not in collection: collection.append(v)
    g.flags=[f for f in g.flags if f not in o.effects.get('clear',[])]
    for flag in o.effects.get('flags',[]):
        if flag not in g.flags: g.flags.append(flag)
    event={**scene_public(s),'turn':len(g.history)+1,'action':o.key,'action_label':o.label,
           'story':o.story,'quip':o.quip,'animation':o.effects.get('animation','think'),
           'deltas':{k:getattr(g,k)-v for k,v in before.items() if getattr(g,k)!=v},
           'new_friend':o.effects.get('friend'),'new_item':o.effects.get('item'),'evidence':evidence}
    g.history.append(event);g.revision+=1
    if len(g.history)>=7: g.phase='ended';g.ending=ending_for(g)
    return event

def ending_for(g):
    met={'lunch':g.food>=2,'glory':g.fame>=5,'friends':len(g.friends)>=3,'rest':g.naps>=3}[g.mission]
    if 'regional honey manager' in g.items:
        title,sub='Accidentally employed.','You left for a small adventure. You returned in middle management.'
    elif 'duck_king' in g.flags:
        title,sub='Long live the nap.','Mallow is a pond monarch. The ducks are asking about annual leave.'
    elif g.trouble>=4:
        title,sub='A locally wanted legend.','The adventure is over. The woodland group chat is not.'
    elif g.naps>=4:
        title,sub='A landmark day in doing less.','Seven decisions. Several naps. A heroic refusal to be productive.'
    elif len(g.friends)>=3:
        title,sub='Came home with a committee.','Mallow went out alone. The woods have apparently moved in.'
    elif g.food>=5:
        title,sub='Lunch, with a side of lunch.','The bag is full. The afternoon is nutritionally successful.'
    elif g.food==0:
        title,sub='Character development for dinner.','Mallow has stories. His stomach wanted something more tangible.'
    else:
        title,sub='Home. More or less intact.','Some of this afternoon requires a carefully worded explanation.'
    loose=[]
    for flag,text in [('owes_goblin','The goblin is still keeping your tab open.'),('goblin_grudge','The bridge keeper has not accepted your connection request.'),('bee_contract','The bees expect you at work on Monday.'),('weekend_promise','Your subjects remember the promise of longer weekends.')]:
        if flag in g.flags: loose.append(text)
    if 'goose passenger' in g.items: loose.append('There is still a goose in your personal space.')
    return {'title':title,'subtitle':sub,'mission_met':met,'mission_label':MISSIONS[g.mission],
            'loose_ends':loose,'score':g.food*3+len(g.friends)*4+g.fame+g.naps*2-g.spent-g.trouble,
            'souvenir':g.items[-1] if g.items else 'a suspiciously eventful afternoon'}
