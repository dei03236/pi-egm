# @tklu/pi-egm — local EGM fork

This is a local, unpublished fork. No npm account is required to use it.

## Provenance

- Baseline: the installed `@rizkiaprita/egm@0.3.2` package, including any local modifications present when copied.
- Source installation: `C:\TechemTools\Programme\Pi\npm\node_modules\@rizkiaprita\egm`.
- Working directory: `C:\TechemTools\Projekte\sources\pi-egm`.
- Upstream repository declared by that package: https://github.com/google/elephant-goldfish-model.
- License: Apache-2.0. Original source copyright headers and `LICENSE` are retained.
- This snapshot does not contain upstream Git history and is not asserted to match the pristine npm release or the latest upstream repository.
- Existing `author`, `repository`, and `homepage` metadata identify the original upstream project, not a hosted repository for this local fork.

## Initial local modifications

- Rename the package to `@tklu/pi-egm`.
- Set `private: true` and remove `publishConfig` to guard against accidental npm publication.
- Add a local-fork notice to `README.md`, this provenance file, and local Git ignore rules.
- Keep extension code, skills, agent personas, resources, and compatibility identifiers unchanged.
- Preserve copied files byte-for-byte except the explicitly modified metadata and README; use CRLF for newly authored text.

## Try without changing the configured installation

The original EGM package is already installed. Do not load both copies together: they register the same tool and commands.
Start a separate Pi session with other extension loading disabled:

```powershell
pi --no-extensions -e "C:\TechemTools\Projekte\sources\pi-egm"
```

This is temporary and does not change Pi's configured packages. Other installed extensions are disabled for that invocation.

## Switch the configured installation later

Only do this when you want the local fork to replace the current npm installation:

```powershell
pi remove npm:@rizkiaprita/egm
pi install "C:\TechemTools\Projekte\sources\pi-egm"
```

Restart Pi afterward. Do not run these commands while relying on unsaved modifications in the old installation: package removal may delete it. The local snapshot above is independent.

To return to the npm package:

```powershell
pi remove "C:\TechemTools\Projekte\sources\pi-egm"
pi install npm:@rizkiaprita/egm@0.3.2
```

Reinstalling the npm release does not restore any former installed-only patches.

## Publication

Nothing has been published, no remote is configured, and the active Pi package settings have not been changed.
`private: true` makes npm refuse publication. If publishing later, first select a package name you own, review licensing and contents, and deliberately change the publication settings.
