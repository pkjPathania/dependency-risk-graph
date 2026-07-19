package io.github.pkjpathania.dependencyrisk.graph.parser.assembler;

import io.github.pkjpathania.dependencyrisk.graph.parser.config.JsonLdProperties;
import io.github.pkjpathania.dependencyrisk.graph.repo.JenaGraphRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.riot.Lang;
import org.apache.jena.riot.RDFParser;
import org.cyclonedx.exception.ParseException;
import org.cyclonedx.model.Bom;
import org.cyclonedx.parsers.BomParserFactory;
import org.cyclonedx.parsers.Parser;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@Slf4j
public class CycloneDxJsonAssembler extends CycloneDxJsonLdAssembler {

  private final JenaGraphRepository repository;

  public CycloneDxJsonAssembler(
      JenaGraphRepository repository, ObjectMapper objectMapper, JsonLdProperties properties) {
    super(objectMapper, properties);
    this.repository = repository;
  }

  public void save(byte[] content) {
    try {
      final Parser parser = BomParserFactory.createParser(content);
      Bom bom = parser.parse(content);
      save(bom);
    } catch (ParseException e) {
      throw new RuntimeException(e);
    }
  }

  private void save(Bom bom) {
    Model model =
        RDFParser.create().fromString(assemble(bom).toString()).forceLang(Lang.JSONLD11).toModel();
    repository.saveAll(model);
  }
}
