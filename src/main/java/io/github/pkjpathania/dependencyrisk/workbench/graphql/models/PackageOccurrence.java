package io.github.pkjpathania.dependencyrisk.workbench.graphql.models;

import io.github.pkjpathania.dependencyrisk.util.GenUtil;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class PackageOccurrence extends DrgBaseEntity {

  private String bomRef;
  private String componentType;
  private String group;
  private String purl;
  private String version;

  @Override
  public String toString() {
    return GenUtil.toJson(this);
  }
}
