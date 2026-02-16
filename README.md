# pub-recs.github.io

A client-side web application to view an individual's recommendations stored as JSON on a public GitHub gist called `recommendations.js`.

## Features

- 🔍 **Search and Filter**: Search across all recommendation fields in real-time
- 📂 **Collapsible Sections**: Organize recommendations into "Given" and "Received" categories
- 🎨 **Modern UI**: Clean, responsive design that works on all devices
- 🔒 **Client-Side Only**: No server required, all processing happens in your browser
- 🚀 **GitHub Gist Integration**: Load recommendations directly from public GitHub gists

## Usage

1. Visit the app at: `https://pub-recs.github.io`
2. Enter either:
   - A GitHub username (the app will look for a gist named `recommendations.js`)
   - A full gist URL containing the `recommendations.js` file
3. Click "Load Recommendations" to fetch and display the data
4. Use the search box to filter recommendations by any text field
5. Click on section headers to collapse/expand "Given" and "Received" sections

### URL Parameters

You can also link directly to a user's recommendations:
- `https://pub-recs.github.io?user=username`
- `https://pub-recs.github.io?gist=gist-url`

## Creating Your Own Recommendations Gist

1. Create a new gist on GitHub
2. Name the file `recommendations.js`
3. Use the following JSON format:

```json
{
  "given": [
    {
      "name": "Person Name",
      "relationship": "How you know them",
      "title": "Their Job Title",
      "company": "Company Name",
      "date": "Date of recommendation",
      "text": "The recommendation text"
    }
  ],
  "received": [
    {
      "name": "Person Name",
      "relationship": "How they know you",
      "title": "Their Job Title",
      "company": "Company Name",
      "date": "Date of recommendation",
      "text": "The recommendation text"
    }
  ]
}
```

See `example-recommendations.js` for a complete example.

## Development

This is a simple static site with no build process required:

- `index.html` - Main HTML structure
- `styles.css` - Styling and responsive design
- `app.js` - JavaScript for fetching and displaying recommendations
- `example-recommendations.js` - Example data format

## License

MIT License - feel free to use and modify as needed.
