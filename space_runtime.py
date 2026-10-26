"""Free ZeroGPU deployment. User saves stay in their browser; GPU calls have no owner token."""
import os
from pathlib import Path
import spaces  # Must initialize ZeroGPU before torch/model imports.
import gradio as gr
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn
from decisions import decision_input, public_result
from inference import LayaDecision

ROOT = Path(__file__).resolve().parent
model = LayaDecision(device='cuda')
model.load()
if model.status != 'ready':
    raise RuntimeError('Laya could not load. Check the Space build/runtime log.')


@spaces.GPU(duration=10)
def decide(payload):
    try:
        state, question = decision_input(payload)
        return public_result(model.predict(state, question))
    except (ValueError, TypeError, KeyError):
        return {'error': 'Invalid decision request. No action was played.'}


app = FastAPI(docs_url=None, redoc_url=None)


@app.get('/api/status')
def status():
    return {**model.metadata(), 'deployment': 'hosted', 'transport': 'gradio'}


@app.get('/api/health')
def health():
    return {'status': 'ready', 'model': model.status}


app.mount('/play', StaticFiles(directory=ROOT / 'web', html=True), name='game')
with gr.Blocks(title='NapQuest') as demo:
    gr.Markdown('# NapQuest\n[Play the game](/play/)\n\nGive Mallow a goal, or play by hand. '
                'Laya runs on a shared free GPU. AI calls can queue or hit a daily allowance. '
                'Manual play keeps working. Your village is saved in your browser.')
    payload = gr.JSON(label='Decision request', visible=False)
    answer = gr.JSON(label='Laya decision', visible=False)
    button = gr.Button('Decide', visible=False)
    button.click(decide, inputs=payload, outputs=answer, api_name='decide', concurrency_limit=1)
demo.queue(max_size=24, default_concurrency_limit=1)
app = gr.mount_gradio_app(app, demo, path='/', run_history=False)

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 7860)))
