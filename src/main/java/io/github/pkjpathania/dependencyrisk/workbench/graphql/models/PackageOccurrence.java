package io.github.pkjpathania.dependencyrisk.workbench.graphql.models;

import io.github.pkjpathania.dependencyrisk.util.GenUtil;
import java.util.List;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class PackageOccurrence extends DrgBaseEntity {

  private String bomRef;
  private String componentType;
  private List<PackageOccurrence> hasPackages;
  private String group;
  private String version;
  private List<String> affectedBy;

  @Override
  public String toString() {
    return GenUtil.toJson(this);
  }
}
