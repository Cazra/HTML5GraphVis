outputs = project/graphCanvasInteractiveCompiled.js project/graphCanvasRenderingCompiled.js project/graphSVGInteractiveCompiled.js project/graphSVGRenderingCompiled.js project/ProtovisInteractiveCompiled.js project/ProtovisRenderingCompiled.js

all : 
	java -jar compiler.jar --js=project/graphCanvasInteractive.js --js=project/commonObjects.js --js_output_file=project/graphCanvasInteractiveCompiled.js
	java -jar compiler.jar --js=project/graphCanvasRendering.js --js=project/commonObjects.js --js_output_file=project/graphCanvasRenderingCompiled.js
	java -jar compiler.jar --js=project/graphSVGInteractive.js --js=project/commonObjects.js --js_output_file=project/graphSVGInteractiveCompiled.js
	java -jar compiler.jar --js=project/graphSVGRendering.js --js=project/commonObjects.js --js_output_file=project/graphSVGRenderingCompiled.js
	java -jar compiler.jar --js=project/ProtovisInteractive.js --js=project/commonObjects.js --js_output_file=project/ProtovisInteractiveCompiled.js
	java -jar compiler.jar --js=project/ProtovisRendering.js --js=project/commonObjects.js --js_output_file=project/ProtovisRenderingCompiled.js

.PHONY : clean

clean : 
	-rm -f $(outputs)
