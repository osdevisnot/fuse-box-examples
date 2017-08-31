const {
    FuseBox,
    TypeScriptHelpers,
    SassPlugin,
    CSSPlugin,
    WebIndexPlugin,
    Sparky,
    HotReloadPlugin,
} = require("fuse-box");
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');
// load
const TypeHelper = require('fuse-box-typechecker').TypeHelper;
// Async check (worker)
const testAsync = TypeHelper({
    tsConfig: './tsconfig.json',
    basePath:'./src',
    name: 'Test async'
});
const { runCLI } = require("jest");

let fuse, app, vendor, isProduction;

Sparky.task("config", () => {
    fuse = FuseBox.init({
        homeDir: "src",
        output: "dist/$name.js",
        tsConfig: "tsconfig.json",
        sourceMaps: !isProduction,
        plugins: [
            [SassPlugin(), CSSPlugin()],
            HotReloadPlugin({
                port: "4444",
                uri: ""
            }),
            TypeScriptHelpers(),
            WebIndexPlugin({
                template: "src/index.html",
                title: "React + Reflux example",
                target: "index.html",
                bundles: ["app", "vendor"]
            })
        ]
    });

    vendor = fuse.bundle("vendor").instructions("~/application.tsx");
    app = fuse.bundle("app").instructions(" !> [/development.tsx]");
    testAsync.runAsync();
});

Sparky.task("check-updates", () => {
    updateNotifier({pkg}).notify();
});

Sparky.task("default", ["clean", "config", "check-updates", "tests"], () => {
    if (!isProduction) {
        fuse.dev({
            root: "dist"
        });
    }
    // add dev instructions
    app.watch().hmr();
    return fuse.run();
});

Sparky.task("tests", () => {
    runCLI({}, ["src"]);
});

Sparky.task("clean", () => Sparky.src("dist/").clean("dist/"));

Sparky.task("prod-env", ["clean"], () => {
    isProduction = true
});

Sparky.task("dist", ["prod-env", "config"], () => {
    // comment out to prevent dev server from running (left for the demo)
    fuse.dev();
    return fuse.run();
});



