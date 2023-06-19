const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = process.env.PORT || 3000;


const app = express();
app.use(cors({ origin: true }));

// Analiza el cuerpo de la solicitud como JSON
app.use(bodyParser.json()); 
// Analiza el cuerpo de la solicitud como URL codificado
app.use(bodyParser.urlencoded({ extended: false })); 


var serviceAccount = require("./permissions.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();



// Agrega una ruta GET a la aplicación Express que acepta un parámetro de nombre de colección. Cuando se llama a esta ruta, el código consulta la base de datos Firestore para obtener todos los documentos de la colección especificada y los devuelve en un objeto de respuesta JSON. Si se produce un error durante la consulta a la base de datos, el código devuelve un error de estado 500 junto con el mensaje de error.
app.get('/read/:collection_name', (req, res) => {
    (async () => {
        try {
            let query = db.collection(req.params.collection_name);
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        id: doc.id,
                        item: doc.data()
                    };
                    response.push(selectedItem);
                }
            });
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

const chatCollectionRef = db.collection('chat');

// Agrega una ruta POST a la aplicación Express que acepta los datos de entrada en formato JSON. Cuando se llama a esta ruta, el código extrae los datos de entrada de la solicitud HTTP POST y crea un objeto chatItem con el contenido de la solicitud y la respuesta de chat. Luego, el código agrega el objeto chatItem como un nuevo documento en la colección de chat en la base de datos Firestore y devuelve un objeto JSON con el ID del nuevo documento creado. Si se produce un error al agregar el nuevo documento a la base de datos, el código devuelve un error de estado 500 junto con un mensaje de error.
app.post('/chat', (req, res) => {
    console.log('Body de la solicitud HTTP POST:', req.body); // Imprime el cuerpo de la solicitud HTTP POST
  const chatItem = {
    request: req.body.request,
    response: req.body.response
  };
  console.log('Nuevo item para chat:', chatItem);

  chatCollectionRef.add(chatItem)
    .then((docRef) => {
      console.log('Nuevo documento creado con ID:', docRef.id);
      return res.status(200).json({ id: docRef.id });
    })
    .catch((error) => {
      console.error('Error al crear el documento:', error);
      return res.status(500).json({ error: 'Error al crear el documento' });
    });
});

app.listen(port, () => { console.log("Server running on port:" + port) });