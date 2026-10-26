"""Boot the reviewed game bundle using the native ZeroGPU Gradio lifecycle."""
import hashlib
import sys
import zipfile
from pathlib import Path
import spaces
import gradio as gr
from starlette.routing import Route, Mount
from starlette.responses import JSONResponse, RedirectResponse
from starlette.staticfiles import StaticFiles

root = Path(__file__).resolve().parent
bundle = root / 'runtime.zip'
assert hashlib.sha256(bundle.read_bytes()).hexdigest() == '__RUNTIME_SHA256__', 'Runtime bundle changed'
destination = root / 'runtime'
with zipfile.ZipFile(bundle) as archive:
    archive.extractall(destination)
sys.path.insert(0, str(destination))
from inference import LayaDecision
from decisions import decision_input, public_result

model = LayaDecision(device='cuda')
model.load()
if model.status != 'ready':
    raise RuntimeError('Laya could not load. Check the runtime log.')

@spaces.GPU(duration=10)
def decide(payload):
    try:
        state, question = decision_input(payload)
        return public_result(model.predict(state, question))
    except (ValueError, TypeError, KeyError):
        return {'error': 'Invalid decision request. No action was played.'}

async def status(request):
    return JSONResponse({**model.metadata(), 'deployment': 'hosted', 'transport': 'gradio'})

async def play_index(request):
    return RedirectResponse('/play/index.html')

async def health(request):
    return JSONResponse({'status': 'ready', 'model': model.status})

with gr.Blocks(title='NapQuest') as demo:
    gr.Markdown('# NapQuest\n[Play the game](/play/index.html)\n\nGive Mallow a goal, or play by hand. '
                'Laya runs on a shared free GPU. AI calls can queue or hit a daily allowance. '
                'Your village is saved in your browser.')
    payload = gr.JSON(label='Decision request', visible=False)
    answer = gr.JSON(label='Laya decision', visible=False)
    button = gr.Button('Decide', visible=False)
    button.click(decide, inputs=payload, outputs=answer, api_name='decide', concurrency_limit=1)
demo.queue(max_size=24, default_concurrency_limit=1)
routes = [Route('/play', play_index), Route('/api/status', status), Route('/api/health', health),
          Mount('/play', StaticFiles(directory=destination / 'web', html=True))]
demo.launch(server_name='0.0.0.0', server_port=7860, ssr_mode=False,
            app_kwargs={'routes': routes}, run_history=False)
