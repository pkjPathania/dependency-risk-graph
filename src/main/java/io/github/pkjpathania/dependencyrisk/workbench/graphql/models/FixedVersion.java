package io.github.pkjpathania.dependencyrisk.workbench.graphql.models;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class FixedVersion {
  String id;
  String packageName;
  String version;
  String purl;
}
