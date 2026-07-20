package io.github.pkjpathania.dependencyrisk.graph.controller;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.pkjpathania.dependencyrisk.graph.model.GraphMetadata;
import io.github.pkjpathania.dependencyrisk.graph.model.GraphSummary;
import io.github.pkjpathania.dependencyrisk.graph.parser.assembler.CycloneDxJsonAssembler;
import io.github.pkjpathania.dependencyrisk.graph.service.RdfExportService;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.ObjectMapper;

class IngestionControllerTest {

  @Test
  void readsMultipartFileAtRdfNewAndReturnsUpdatedMetadata() throws Exception {
    CycloneDxJsonAssembler assembler = mock(CycloneDxJsonAssembler.class);
    RdfExportService rdfExportService = mock(RdfExportService.class);
    GraphMetadata metadata =
        new GraphMetadata(new GraphSummary(12, 1, 4, 3), new ObjectMapper().createObjectNode());
    when(rdfExportService.getSummary()).thenReturn(metadata);

    MockMvc mockMvc =
        MockMvcBuilders.standaloneSetup(new IngestionController(assembler, rdfExportService))
            .build();
    byte[] content = "{\"bomFormat\":\"CycloneDX\"}".getBytes(StandardCharsets.UTF_8);
    MockMultipartFile file =
        new MockMultipartFile("file", "bom.json", "application/json", content);

    mockMvc
        .perform(multipart("/rdf/new").file(file))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.summary.trippleCount").value(12))
        .andExpect(jsonPath("$.summary.applicationCount").value(1));

    ArgumentCaptor<byte[]> contentCaptor = ArgumentCaptor.forClass(byte[].class);
    verify(assembler).save(contentCaptor.capture());
    assertArrayEquals(content, contentCaptor.getValue());
  }
}
