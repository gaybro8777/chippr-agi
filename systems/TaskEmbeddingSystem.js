import { CHIPPRAGI } from "../index.js";

CHIPPRAGI.registerSystem('TaskEmbeddingSystem', {
  info: {
    version : "",
    license : "",
    developer: "",
    description : "",
  },

  init: function (_eventEmitter) {
        _eventEmitter.on('newEntity', (data) => {
          this.handleNewEntity(data);
        });
  },

  remove: function () {
    // Do something when the component or its entity is detached, if needed.
    this.CHIPPRAGI.eventBus.off('newEntity', this.handleNewEntity);
  },
  
  //methods go here
  handleNewEntity: async function (data){
      //look at how to do this with db
      let taskDescription = CHIPPRAGI.entities[data.entityID]['TaskDescription'].task;
      let clean_text = taskDescription.replace("\n", " ")
      //console.log(clean_text);
      let response= await CHIPPRAGI.langModel.createEmbedding({
          model : "text-embedding-ada-002",
          input : clean_text
      });
      //console.log(response.data.data[0].embedding);
      let floatbuffer = this.float32Buffer(response.data.data[0].embedding);
        let clean = response.data.data[0].embedding;
        await CHIPPRAGI.vectorDb.save(
            'TaskEmbedding', 
            data.entityID, 
            {
                taskid: data.entityID,
                clean: clean,
                floatbuffer: floatbuffer,
            });
        //keep until everything is moved to db
        CHIPPRAGI.addComponent(data.entityID, 'TaskEmbedding', {
            taskid: data.entityID,
            clean: clean,
            floatbuffer: floatbuffer,
        })
    },
    
    float32Buffer(arr) {
        return Buffer.from(new Float32Array(arr).buffer)
      }
  
  });

