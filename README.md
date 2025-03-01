# Graph Database Visual Interface

This project is a modern web application that provides a no-code visual interface for interacting with graph databases. It allows users to visualize, query, and manipulate graph data through an intuitive drag-and-drop interface.

## Features

### Visual Graph Interface
- Interactive graph visualization with nodes and relationships
- Drag-and-drop interface for creating queries
- Real-time graph updates
- Zoom and pan controls

### Database Management
- Support for multiple graph database connections
- Easy database switching
- Secure credential management
- Support for Neo4j and Bolt protocols

### Multi-tab Workspace
- Multiple concurrent graph views
- Independent workspace for each tab
- Easy tab management (add/remove/switch)

### Advanced Filtering
- Filter nodes by labels and properties
- Filter relationships by types
- Dynamic property search
- Visual relationship type toggling

### Data Exploration
- Node label exploration
- Relationship type exploration
- Property key browsing
- Real-time search functionality

## Technology Stack

### Frontend
- React.js
- Next.js
- CSS Modules
- Dynamic imports for optimized loading
- React Icons
- React Draggable

### Backend
- Django (API endpoints)
- Neo4j database integration
- Authentication and session management

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Neo4j database instance

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lzy-0321/No-Code-Subgraph-Search.git
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Configure environment variables:
Create a `.env` file in both frontend and backend directories with necessary configurations.

5. Start the development servers:


```bash
./run.sh
```

## Usage

1. Connect to your graph database using the database connection interface
2. Use the visual interface to explore your graph data
3. Filter and search through your data using the filter interface
4. Toggle relationship visibility to focus on specific data patterns

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Neo4j team for their graph database platform
- React and Next.js communities for their excellent frameworks
- All contributors who have helped shape this project
- [magic ui](https://magicui.design/) for animations

## License Information

This project is released under the GNU General Public License v3.

### Third-Party Components

This project uses the following major third-party components:

- Next.js (MIT)
- React (MIT)
- TailwindCSS (MIT)
- Django (BSD)
- Django REST framework (BSD)

### License Compliance

When using this project, you must:

1. Keep the source code open
2. Prominently indicate the use of this project
3. Provide the complete license text
4. Mark any code changes
5. Use the same GPLv3 license

For detailed terms, please see:
- [LICENSE](LICENSE) - Project License
- [COPYING](COPYING) - Complete GPLv3 Text
