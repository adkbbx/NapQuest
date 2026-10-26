FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/home/user/app/.cache/huggingface \
    HF_HUB_DISABLE_XET=1 \
    OMP_NUM_THREADS=2 \
    NAPQUEST_HOSTED=1

RUN useradd --create-home --uid 1000 user
WORKDIR /home/user/app
COPY requirements.txt ./
RUN pip install torch==2.14.1 --index-url https://download.pytorch.org/whl/cpu \
    && pip install -r requirements.txt

COPY --chown=user:user app.py hosting.py decisions.py inference.py engine.py ./
COPY --chown=user:user web ./web
RUN chown user:user /home/user/app
USER user

# Bake the pinned English checkpoint into the image. Runtime makes no Hub calls.
RUN python -c "from inference import LayaDecision; m=LayaDecision(); m.load(); assert m.status=='ready',m.error"
ENV HF_HUB_OFFLINE=1
EXPOSE 7860
CMD ["python", "app.py", "--host", "0.0.0.0", "--port", "7860"]
