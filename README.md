# Fleet Board prototype

A mobile-first prototype that replaces a physical fleet status board.

## Included
- Available / In Use / Tagged Out truck statuses
- Driver assignments
- Tag-out reasons and notes
- Filters
- Activity history
- Mobile/PWA support
- Local persistence with browser localStorage

## Run locally
Use any local static server. For example with Python:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 from the fleet-board-app folder.

## Important
This first version stores changes only on the device/browser. The next step is to connect it to Supabase so every driver's phone and the workplace board share the same live data.
