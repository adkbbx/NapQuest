# Third-party notices and media provenance

NapQuest's original application code is MIT licensed; see LICENSE.

The pretrained model is Convai Innovations' [Laya](https://huggingface.co/convaiinnovations/laya), an Apache-2.0 open-weight decision model. The application pins checkpoint revision `7b928d828b7b0e022f929d9bd2e44165aa270148`. Model weights and the local Python environment are not included in the source package. Setup downloads the checkpoint separately. Python dependencies retain their own licenses.

Game illustrations and character part atlases were generated during development with OpenAI image generation, using Mallow's supplied design as an identity reference. See ART_AND_RIGS.md and LEVEL_FIVE.md for the production prompts and animation limits.

The 21 included sound recordings were generated during development with the user's ElevenLabs subscription. The runtime loads those local recordings; it does not call ElevenLabs or require a player API key. Their prompt summaries and filenames are in `web/assets/audio/manifest.json`. Generated media and model weights should not be assumed to carry the application's MIT license; applicable provider terms and rights still apply.

No login sessions, subscription credentials, model caches or player saves belong in a distribution. The submission packaging script uses an explicit file selection and checks for credential patterns before producing the archive.
