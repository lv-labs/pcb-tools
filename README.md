# LV Labs electronics workbench

A responsive, static Astro app with a React calculator island, Tailwind v4 and local shadcn-style Button/Input components. Eight calculators, editable signal conversion fields, schematic references and live filter response plots. No backend or external runtime services.

## Develop

```sh
npm install
npm run dev
```

Open http://localhost:4321/.

```sh
npm run check
npm test
npm run build
```

## Deployment — tools.lv-labs.com

This app follows the CircuitJS repo's deployment model: GitHub Actions builds the app and uploads the static output to a dedicated Cloudflare Pages project. It serves at the root of **https://tools.lv-labs.com/**.

- Pages project name: `pcb-tools`
- Production branch: `main`
- Build command: `npm run build`
- Output directory: `dist`
- Runtime: Node 24 in GitHub Actions; Node 22.23.4+ supported locally
- Workflow: `.github/workflows/deploy-pages.yml`

### One-time setup

1. Create a GitHub repository for this app, with `main` as its default branch, and push this directory to it.
2. In Cloudflare, create a **Direct Upload** Pages project named `pcb-tools` with production branch `main`. Use the same Cloudflare account as CircuitJS.
3. Add the Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to the new GitHub repo. Use the same secret names as CircuitJS. Its token can be reused if its existing Cloudflare Pages Edit permission covers this project. Repository secrets do not automatically transfer between repositories; organization secrets must grant the new repository access.
4. Run **Deploy to Cloudflare Pages** from GitHub Actions, or push to `main`. The workflow installs locked dependencies, checks types, runs calculation tests, builds and deploys `dist/`.
5. In Cloudflare, open **Workers & Pages → pcb-tools → Custom domains → Set up a domain** and add **tools.lv-labs.com**. Complete the DNS setup shown by Cloudflare. Register the custom domain in Pages before adding any manual CNAME; a CNAME on its own does not bind the domain to the project.
6. Wait until Cloudflare reports the custom domain as active, then visit https://tools.lv-labs.com/.

After setup, pushes to `main` deploy automatically. Pull requests run the build checks without deploying. Manual deployment runs are limited to `main`. The existing CircuitJS deployment and `circuit.lv-labs.com` remain separate.

`astro.config.mjs` sets the production site URL and root asset paths. `SITE_URL` can override the canonical origin; `BASE_PATH` can override the base path for a special build. No Cloudflare runtime adapter, Worker or database is needed for this static app.

### Optional subdirectory export

The earlier deployment option remains available:

```sh
npm run build:subdirectory
```

This prepares `bundle/tools/` for copying into another site's output. Normal `npm run build` creates a root-level app in `dist/` for the dedicated Pages project. The subdirectory export is not used by the deployment workflow.

## Calculators and assumptions

- **Signal levels:** edit Vrms, dBu, dBV, Vpp or Vpeak. Uses the exact historical dBu reference √0.6 V (about 0.7746 V). Peak relationships assume a sine wave. Zero voltage corresponds to −∞ dBu/dBV.
- **Op-amp gain:** ideal inverting and non-inverting closed-loop gain; dB uses gain magnitude.
- **Active filter:** first-order RC low-pass followed by a non-inverting gain stage. Diagram uses a labeled gain block. Not a second-order Sallen–Key filter.
- **RC filter:** unloaded first-order low-pass and high-pass; cutoff, time constant, gain and phase at a test frequency. Graph spans 0.01–100 times cutoff and shows magnitude relative to passband.
- **Voltage divider:** unloaded output, current and Thevenin output resistance.
- **Resistor networks:** two resistors in series and parallel.
- **Ohm’s law:** current and power from voltage and resistance.
- **LED resistor:** ideal series resistance and dissipation from supply, forward voltage and desired current.

Invalid or incomplete inputs suppress calculated results. Component values must be positive; signed DC voltage is accepted in the divider and Ohm's law calculators. Values remain in memory while switching calculators and reset on reload. The reset button restores all defaults. Clipboard copying requires a secure context (HTTPS or localhost).

## References

- [Astro base configuration](https://docs.astro.build/en/reference/configuration-reference/#base)
- [shadcn/ui with Astro](https://ui.shadcn.com/docs/installation/astro)
- [Cloudflare Pages CI deployment](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Pages Astro guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [Analog Devices: active filtering](https://wiki.analog.com/university/courses/electronics/electronics-lab-active-filter)

The local UI components and `components.json` support extending the app with shadcn/ui components.
