<p align="center">
  <img alt="Swirly" src="https://user-images.githubusercontent.com/201034/82764045-6173da00-9e0c-11ea-9bee-4fb6543d977a.png" width="480">
</p>

<p align="center">
  A marble diagram generator.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/swirly"><img alt="npm" src="https://img.shields.io/npm/v/swirly.svg"></a>
  <a href="https://standardjs.com"><img alt="JavaScript Standard Style" src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg"></a>
</p>

## Example

Here's Swirly rendering the effect of the `concatAll` operator:

![concatAll](examples/concatAll.png)

The image above was built from
[this marble diagram specification](examples/concatAll.txt).

Diagram specifications use an extension of the syntax used for
[RxJS marble testing](https://github.com/ReactiveX/rxjs/blob/fc3d4264395d88887cae1df2de1b931964f3e684/docs_app/content/guide/testing/marble-testing.md).
Please consult the [examples](examples.md) to learn how to create diagrams.

## Web Version

You can use Swirly in your browser at
[**swirly.dev**](https://swirly.dev/).

The Web version allows you to edit diagram specifications in real time and
export them to an SVG or a PNG image. You can also
[run it from a checkout](CONTRIBUTING.md#running-the-web-app-locally).

## CLI Version

Swirly is also available as a command-line utility. To run it, you need a
sufficiently recent version of [Node.js](https://nodejs.org/).

To install Swirly on your machine, just install the `swirly` npm package:

```bash
npm install -g swirly
```

Next, create `diagram.txt` with your diagram specification. Take a look at the
[examples](examples/) to learn about the expected syntax.

You can then generate an SVG image from the specification by simply running:

```bash
swirly diagram.txt diagram.svg
```

Swirly can also output PNG images. Since PNG is a raster image format, you may
want to increase the resolution to get a higher-quality result. You can do so by
passing `--scale` followed by a percentage. For example, this will render the
image at twice its original size:

```bash
swirly --scale=200 diagram.txt diagram.png
```

## Contributing

Swirly is a Yarn workspace monorepo. To build it, run the Web app or the CLI
from a checkout, or add an example or a diagram feature, see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Author

[Tim De Pauw](https://tmdpw.eu)

## License

MIT
